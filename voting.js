// Modules
const {client} = require("./index.js");
const {logMessage, sendMessage, addRole, removeRole, toTimeString, toUnixTime, defaultRequire, save} = require("./helpers.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const status = require(twowPath + "status.json");
const {currentRound: currentRegularRound, currentVotingRound, seasonPath, roundPath: regularRoundPath, votingRoundPath, phase} = status;
const currentRound = phase === "both" ? currentVotingRound : currentRegularRound;
const roundPath = phase === "both" ? votingRoundPath : regularRoundPath;
const {
	id: serverId,
	roles: {supervoter, votingRemind, votingPing},
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
	let lessScreens = Math.floor(responseAmount / IDEAL);
	let lessScreensSize = responseAmount / lessScreens;
	let moreScreens = Math.ceil(responseAmount / IDEAL);
	let moreScreensSize = responseAmount / moreScreens;
	let betterAmount = lessScreensSize - IDEAL <= IDEAL - moreScreensSize ? lessScreens : moreScreens;
	if (responseAmount / betterAmount < MIN) {
		betterAmount = lessScreens;
	}
	let betterSize = responseAmount / betterAmount;
	// Partition
	let screenSizes = Array(betterAmount);
	screenSizes.fill(Math.floor(betterSize));
	screenSizes.fill(Math.ceil(betterSize), 0, responseAmount % betterAmount);
	return screenSizes;
}
async function createScreen(responses, keyword, section, textScreen = false) {
	let rows = new Map();
	let ids = new Map();
	// Create text screen
	let screen = `\`\`\`\n${keyword}\n`;
	// TODO: Extend characters
	let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let charIndex = 0;
	for (const response of responses) {
		let char = chars[charIndex];
		screen += `${char}\t${response.twist ?? response.text}\n`;
		rows.set(char, response.twist ?? response.text);
		ids.set(char, response.id);
		charIndex++;
	}
	screen += "```";
	logMessage(screen);
	screenSections[keyword] = section;
	screenResponses[keyword] = Object.fromEntries(ids.entries());
	// Draw screen
	const path = `${roundPath}/screens/${keyword}.png`;
	await drawScreen(path, keyword, prompt, Array.from(rows.entries()));
	await sendMessage(voting, {
		content: textScreen ? screen : null, // For easy voter.js input
		files: [{
			attachment: path,
			name: keyword + ".png"
		}]
	}, true);
}
async function createSection(responses, sizes, sectWord) {
	for (let i = 0; i < responses.length; i++) { // Randomize response array
		const j = Math.floor(Math.random() * i);
		[responses[i], responses[j]] = [responses[j], responses[i]];
	}
	for (let i = 0; i < sizes.length; i++) {
		const keyword = autoKeywords ? `${sectWord}-${i + 1}` : keywords[sectWord][i];
		await createScreen(responses.splice(0, sizes[i]), keyword, sectWord);
	}
	sectionScreens[sectWord] = sizes.length;
}
exports.initVoting = async function () {
	logMessage("Voting period started.");
	const unixDeadline = toUnixTime(vDeadline);
	await sendMessage(voting, `<@&${votingPing}> ${currentRound}\nVote to <@814748906046226442> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)`, true);
	// Create voting
	logMessage(prompt);
	const screenSizes = partitionResponses(responses.length);
	for (let i = 0; i < sections; i++) {
		const sectWord = autoKeywords ? (i + 1).toString() : Object.keys(keywords)[i];
		await createSection([...responses], screenSizes, sectWord);
	}
	if (megascreen) {
		sectionScreens["MEGA"] = 1;
		await createScreen(responses, "MEGA", "MEGA", true);
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
			logMessage(`[E] ${names[dnpId]}'s roles are not accessible due to leaving the server`, true);
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
exports.logVote = function (message) {
	logMessage(`Recording vote by ${message.author}:\n\t${message}`);
	const voteFull = Array.from(message.content.matchAll(/\[([^\s[\]]+) ([^\s[\]]+)\]/g));
	if (voteFull.length === 0) {
		return "No valid vote found.";
	}
	const section = votes[message.author.id]?.section ?? screenSections[voteFull[0][1]];
	let ratings = new Map();
	for (const [_, screen, vote] of voteFull) {
		// Check validity
		if (!(screen in screenSections)) {
			return `The screen \`${screen}\` does not exist.`;
		}
		if (screenSections[screen] !== section) {
			return `The screen \`${screen}\` is not in section \`${section}\`. You may only vote in one section.`;
		}
		if (vote.length !== Object.keys(screenResponses[screen]).length) {
			return `The vote \`${vote}\` for screen \`${screen}\` is too ${vote.length > Object.keys(screenResponses[screen]).length ? "long" : "short"}.`;
		}
		if (vote.length !== (new Set(vote.split(""))).size) {
			return `The vote \`${vote}\` for screen \`${screen}\` contains duplicate characters.`;
		}
		// Calculate individual response ratings
		let position = 0;
		for (const char of vote) {
			if (!(char in screenResponses[screen])) {
				return `Invalid character \`${char}\` found in vote \`${vote}\` for screen \`${screen}\`.`;
			}
			if (vote.length === 1) {
				ratings.set(screenResponses[screen][char], 0.5);
			} else {
				ratings.set(screenResponses[screen][char], (vote.length - position - 1) / (vote.length - 1));
			}
			position++;
		}
	}
	// Apply ratings to responses (separate step for atomicity)
	for (const [id, rating] of ratings) {
		const response = responses.find(res => res.id === id);
		response.ratings ??= {}; // Would be a map if they were natively serializable
		response.ratings[message.author.id] = rating;
	}
	save(roundPath + "responses.json", responses);
	// Update votes.json
	const matches = voteFull.map(matches => [matches[1], matches[2]]);
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
		removeRole(serverId, message.author.id, votingRemind);
	}
	// TODO: Add more stats
	save(roundPath + "votes.json", votes);
	return `Your vote has been recorded:\n\`\`\`${voteFull.map(matches => matches[0]).join("\n")}\`\`\`${votes[message.author.id].supervote ? "Thank you for supervoting!" : ""}`;
};