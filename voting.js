// Modules
const {client} = require("./index.js");
const {
	logMessage, sendMessage, addRole, removeRole,
	toTimeString, toUnixTime,
	defaultRequire, save,
	scramble, suffixPlural
} = require("./helpers.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const status = require(twowPath + "status.json");
const {currentRound: currentRegularRound, currentVotingRound, seasonPath, roundPath: regularRoundPath, votingRoundPath, phase} = status;
const currentRound = phase === "both" ? currentVotingRound : currentRegularRound;
const roundPath = phase === "both" ? votingRoundPath : regularRoundPath;
const {
	id: serverId,
	roles: {supervoter, votingRemindPing, votingPing},
	channels: {bots, voting, reminders: remindersId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {reminders, autoKeywords} = require(seasonPath + "seasonConfig.json");
const {drawScreen} = require(seasonPath + "graphics.js");
// Round-specific
const {prompt, vDeadline, keywords} = require(roundPath + "roundConfig.json");
const {sections, megascreen} = defaultRequire(seasonPath + "seasonConfig.json", roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
const responses = require(roundPath + "responses.json");
const votes = require(roundPath + "votes.json");
const screens = require(roundPath + "screens.json");
const {screenSections, screenResponses, sectionScreens} = screens;
// Functions
function partitionResponses(responseAmount) {
	const MIN = 8;
	const IDEAL = 10;
	// Trivial case
	if (responseAmount < 2 * MIN) {
		return [responseAmount];
	}
	// General case
	// Determine if less or more screens is closer to the ideal
	const lessScreens = Math.floor(responseAmount / IDEAL);
	const lessScreensSize = responseAmount / lessScreens;
	const moreScreens = Math.ceil(responseAmount / IDEAL);
	const moreScreensSize = responseAmount / moreScreens;
	let betterAmount = lessScreensSize - IDEAL <= IDEAL - moreScreensSize ? lessScreens : moreScreens;
	if (responseAmount / betterAmount < MIN) {
		betterAmount = lessScreens;
	}
	const betterSize = responseAmount / betterAmount;
	// Partition
	const screenSizes = Array(betterAmount);
	screenSizes.fill(Math.floor(betterSize));
	screenSizes.fill(Math.ceil(betterSize), 0, responseAmount % betterAmount);
	return screenSizes;
}
async function createScreen(path, responses, keyword, section, textScreen = false) {
	const rows = new Map();
	const ids = new Map();
	// Create text screen
	let screen = `\`\`\`\n${keyword}\n`;
	// TODO: Extend characters
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let charIndex = 0;
	for (const response of responses) {
		const char = chars[charIndex];
		screen += `${char}\t${response.twist ?? response.text}\n`;
		rows.set(char, response.twist ?? response.text);
		ids.set(char, response.id);
		charIndex++;
	}
	screen += "```";
	logMessage(screen);
	screenSections[keyword] = section;
	screenResponses[keyword] = Object.fromEntries(ids.entries());
	// Draw and send screen
	await drawScreen(path, keyword, prompt, Array.from(rows.entries()));
	await sendMessage(voting, {
		content: textScreen ? screen : null, // For easy voter.js input
		files: [{
			attachment: path,
			name: keyword + ".png"
		}]
	}, true, false, keyword + ".txt");
}
async function createSection(path, responses, sizes, sectWord) {
	for (let i = 0; i < sizes.length; i++) {
		const keyword = autoKeywords ? `${sectWord}-${i + 1}` : keywords[sectWord][i];
		await createScreen(`${path}${keyword}.png`, responses.splice(0, sizes[i]), keyword, sectWord);
	}
	sectionScreens[sectWord] = sizes.length;
}
async function initVoting() {
	logMessage("Voting period started.");
	if (status.phase !== "both") {
		status.phase = "voting";
		await save(`${twowPath}/status.json`, status);
	}
	const unixDeadline = toUnixTime(vDeadline);
	await sendMessage(voting, `<@&${votingPing}> ${currentRound}\nVote to <@814748906046226442> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)`, true);
	// Create voting
	logMessage(prompt);
	const screenSizes = partitionResponses(responses.length);
	for (let i = 0; i < sections; i++) {
		const sectWord = autoKeywords ? (i + 1).toString() : Object.keys(keywords)[i];
		await createSection(`${roundPath}/screens/`, scramble(responses), screenSizes, sectWord);
	}
	if (megascreen) {
		sectionScreens["MEGA"] = 1;
		await createScreen(`${roundPath}/screens/MEGA.png`, scramble(responses), "MEGA", "MEGA", true);
	}
	await save(roundPath + "screens.json", screens);
	// DNP non-responders
	const twow = await client.guilds.fetch(serverId);
	const responders = Object.keys(contestants.responseCount).length;
	contestants.dnp = [...contestants.prize, ...contestants.alive].filter(id => !responders.has(id));
	for (const dnpId of contestants.dnp) {
		try {
			const dnper = await twow.members.fetch(dnpId);
			dnper.roles.remove([prize, alive]);
			dnper.roles.add(dead);
		} catch {
			logMessage(`[E] ${names[dnpId]}'s roles are not accessible due to leaving the server`, "error");
		}
	}
	save(roundPath + "contestants.json", contestants);
	// TODO: Send reminders
	(await twow.roles.fetch(respondingRemind)).members.forEach(member => member.roles.remove(respondingRemind));
	/* for (let reminder in reminders) {
		const date = new Date((unixDeadline - reminders[reminder] * 3600) * 1000);
		if (date.getTime() > Date.now()) {
			const reminderBotTime = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}-${date.toISOString().substring(11, 19)}`;
			// TODO: Non-hardcoded bot channel
			sendMessage(bots[3], `$r <#${bots[3]}> ${reminderBotTime} @everyone You have ${reminder} left to vote!`, true);
		}
	}; */
};
function validateScreen(screen, section) {
	if (!(screen in screenSections)) {
		return `The screen \`${screen}\` does not exist.`;
	}
	if (screenSections[screen] !== section) {
		return `The screen \`${screen}\` is not in section \`${section}\`. You may only vote in one section.`;
	}
	return null;
}
function validateVote(voteText, screen, vote) {
	const errors = [];
	const screenChars = new Set(Object.keys(screenResponses[screen]));
	const voteChars = new Set(vote);
	// Duplicate characters
	const duplicateChars = [...vote].filter((char, i) => vote.indexOf(char) !== i); // Short but unclean
	if (duplicateChars.length > 0) {
		errors.push(`Duplicate character${suffixPlural(duplicateChars)} \`${duplicateChars.join("")}\` found in the vote \`${voteText}\`.`);
	}
	// Invalid characters
	const invalidChars = new Set([...voteChars].filter(char => !screenChars.has(char))); // Replace with set difference when supported
	if (invalidChars.size > 0) {
		errors.push(`Invalid character${suffixPlural(invalidChars)} \`${[...invalidChars].join("")}\` found in the vote \`${voteText}\`.`);
	}
	// Missing characters
	const missingChars = new Set([...screenChars].filter(char => !voteChars.has(char)));
	if (missingChars.size > 0) {
		errors.push(`The character${suffixPlural(missingChars)} \`${[...missingChars].join("")}\` are missing from the vote \`${voteText}\`.`);
	}
	return errors.length === 0 ? null : errors.join("\n");
}
function calculateRatings(screen, vote, ratings) {
	// Calculate individual response ratings
	let position = 0;
	for (const char of vote) {
		if (vote.length === 1) {
			ratings.set(screenResponses[screen][char], 0.5);
		} else {
			ratings.set(screenResponses[screen][char], (vote.length - position - 1) / (vote.length - 1));
		}
		position++;
	}
}
function logVote(message) {
	logMessage(`Recording vote by ${message.author}:\n\t${message}`);
	const voteFull = Array.from(message.content.matchAll(/\[([^\s[\]]+) ([^\s[\]]+)\]/g));
	if (voteFull.length === 0) {
		return "No valid vote found.";
	}
	const section = votes[message.author.id]?.section ?? screenSections[voteFull[0][1]];
	// Find screen errors
	const screenErrors = voteFull.map(([_, screen, __]) => validateScreen(screen, section));
	if (screenErrors.some(error => error != null)) {
		return screenErrors.filter(error => error != null).join("\n");
	}
	// Find vote errors
	const voteErrors = voteFull.map(([voteText, screen, vote]) => validateVote(voteText, screen, vote));
	if (voteErrors.every(error => error != null)) { // No passing screens
		return voteErrors.filter(error => error != null).join("\n");
	}
	// Calculate ratings
	const ratings = new Map();
	const errorFree = voteFull.filter((_, i) => voteErrors[i] == null);
	for (const [_, screen, vote] of errorFree) {
		calculateRatings(screen, vote, ratings);
	}
	// Apply ratings to responses (separate step for atomicity)
	for (const [id, rating] of ratings) {
		const response = responses.find(res => res.id === id);
		response.ratings ??= {}; // Would be a map if they were natively serializable
		response.ratings[message.author.id] = rating;
	}
	save(roundPath + "responses.json", responses);
	// Update votes.json
	const matches = errorFree.map(matches => [matches[1], matches[2]]);
	votes[message.author.id] ??= {
		section: section,
		supervote: false,
		screens: {},
		messages: []
	};
	votes[message.author.id].screens = Object.assign(votes[message.author.id].screens, Object.fromEntries(matches));
	votes[message.author.id].messages.push({
		id: message.id,
		time: toTimeString(message.createdAt),
		text: message.content
	});
	// Remove supervoters from reminders
	if (Object.keys(votes[message.author.id].screens).length === sectionScreens[section]) {
		votes[message.author.id].supervote = true;
		addRole(serverId, message.author.id, supervoter);
		removeRole(serverId, message.author.id, votingRemindPing);
	}
	// TODO: Add more stats
	// Build reply
	save(roundPath + "votes.json", votes);
	let reply = `The following ${errorFree.length === 1 ? "vote has" : "votes have"} been recorded:\n\`\`\`${errorFree.map(matches => matches[0]).join("\n")}\`\`\``;
	if (voteErrors.some(error => error != null)) {
		reply += "**The rest of your vote contains the following errors:**\n" + voteErrors.filter(error => error != null).join("\n");
	} else if (votes[message.author.id].supervote) { // Errors preclude supervoting
		reply += "Thank you for supervoting!";
	}
	return reply;
};
Object.assign(exports, {partitionResponses, createScreen, createSection, initVoting, logVote});