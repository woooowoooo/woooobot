// Modules
// const {client} = require("./index.js");
const {
	logMessage, sendMessage, addRole, removeRole,
	toTimeString, toUnixTime,
	defaultRequire, optRequire, save,
	ordinal, suffixPlural
} = require("./helpers.js");
// Data
const {botId, twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const status = require(twowPath + "status.json");
const {seasonPath, roundPath} = status;
const {
	id: serverId,
	roles: {alive: aliveId, respondingRemindPing, respondingPing, votingPing, resultsPing},
	channels: {bots, prompts, reminders: remindersId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {deadlines, reminders} = require(seasonPath + "seasonConfig.json");
const seasonContestants = require(seasonPath + "seasonContestants.json");
const technicals = optRequire(seasonPath + "technicals.js");
const twists = optRequire(seasonPath + "twists.js");
// Round-specific
const {prompt, author, example, rDeadline, technicals: roundTechnicals = [], twists: roundTwists} = require(roundPath + "roundConfig.json");
const {joins, dummies} = defaultRequire(seasonPath + "seasonConfig.json", roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
const responses = require(roundPath + "responses.json");
// Sanity checks
if (technicals == null && roundTechnicals.filter(tech => tech !== "noTenWord").length > 0) {
	throw Error(`Round includes technicals ${roundTechnicals} but does not define them!`);
}
if (twists == null && roundTwists != null) {
	throw Error(`Round includes twists ${roundTwists} but does not define them!`);
}
if (prompt == null || prompt === "") {
	throw Error(`No prompt provided!`);
}
// Functions
async function initResponding() {
	logMessage("Responding period started.");
	if (status.phase !== "both") {
		status.phase = "responding";
		await save(`${twowPath}/status.json`, status);
	}
	const unixDeadline = toUnixTime(rDeadline);
	let message = `<@&${joins ? respondingPing : aliveId}> ${status.currentRound} Prompt:\`\`\`\n${prompt}\`\`\`Respond to <@${botId}> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)`;
	if (author != null) {
		message += `\nPrompt author: ${author}`;
	}
	if (example != null) {
		message += `\nHere's an example response: \`${example}\``;
	}
	if (roundTechnicals.length > 0) {
		message += `\n\n**Technical${suffixPlural(roundTechnicals)}**:`;
		for (const tech of roundTechnicals) {
			if (tech !== "noTenWord") {
				message += `\n${technicals[tech].title}: ${technicals[tech].description}`;
			}
		}
	}
	if (roundTwists != null && roundTwists.length > 0) {
		message += `\n\n**Twist${suffixPlural(roundTwists)}**:`;
		for (const twist of roundTwists) {
			message += `\n${twists[twist].title}: ${twists[twist].description}`;
		}
	}
	await sendMessage(prompts, message, true);
	// TODO: Send reminders
	/* for (let reminder in reminders) {
		const date = new Date((unixDeadline - reminders[reminder] * 3600) * 1000);
		if (date.toTimeString() > Date.now()) {
			const reminderBotTime = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}-${date.toISOString().substring(11, 19)}`;
			// TODO: Non-hardcoded bot channel
			sendMessage(bots[3], `$r <#${remindersId}> ${reminderBotTime} <@&${aliveId}> You have ${reminder} left to respond to the prompt!`, true);
		}
	}; */
};
function tenWord(response) {
	return response.split(/\s/).filter(word => /\w/.test(word)).length <= 10; // Don't count punctuation-only "words"
}
function checkTechnicals(response) {
	if (!roundTechnicals.includes("noTenWord") && !tenWord(response)) {
		return "Ten Words of Wisdom";
	}
	if (response == null || response === "") {
		return "Don't Have An Empty Response Challenge";
	}
	if (response.includes("```")) {
		return "Don't Try To Game The System Challenge";
	}
	for (let tech of roundTechnicals) {
		if (tech !== "noTenWord" && technicals[tech].check(response) === false) {
			return technicals[tech].title;
		}
	}
	return null;
}
async function logResponse(message) {
	// Reject extra responses and determine dummies
	logMessage(`Recording response by ${message.author}:\n\t${message}`);
	const prized = contestants.prize.includes(message.author.id);
	const alive = prized || contestants.alive.includes(message.author.id);
	const allowedAmount = prized ? 2 : 1;
	const allowed = (contestants.responseCount[message.author.id] ?? 0) < allowedAmount;
	let isDummy = false;
	if (!alive && !joins || !allowed) {
		if (!dummies) {
			return alive ? "You have already responded to the prompt!" : "Non-contestant responses are currently not accepted.";
		}
		isDummy = true;
	}
	// Check technicals
	const failedTechnical = checkTechnicals(message.content);
	if (failedTechnical !== null) {
		return `Your response (\`${message}\`) failed the technical "${failedTechnical}".\nIt has not been recorded; please submit a response that follows all technicals.`;
	}
	// Build response object
	let messageData = {
		id: message.id,
		author: message.author.id,
		time: toTimeString(message.createdAt),
		text: message.content,
		dummy: isDummy || undefined
	};
	if (roundTwists != null) {
		let twistResult = message.content;
		for (const twist of roundTwists) {
			twistResult = await twists[twist].execute(twistResult);
		}
		messageData.twist = twistResult;
	}
	responses.push(messageData);
	// Initialize first-time responders, build reply
	let reply = `Your response (\`${message}\`) has been recorded${message.twist != null ? ` as \`${message.twist}\`` : ""}.`;
	if (isDummy) {
		reply += " **It is a dummy response, which means that its placement in results does not matter.**";
	}
	if (!alive && joins) {
		seasonContestants.contestants.push(message.author.id);
		seasonContestants.names[message.author.id] = message.author.username;
		contestants.alive.push(message.author.id);
		addRole(serverId, message.author.id, aliveId);
		addRole(serverId, message.author.id, respondingPing);
		addRole(serverId, message.author.id, votingPing);
		addRole(serverId, message.author.id, resultsPing);
	}
	reply += ` It is this round's **${ordinal(responses.length)}** submitted response.`;
	// Remove responders from reminders
	contestants.responseCount[message.author.id] ??= 0;
	contestants.responseCount[message.author.id]++;
	if (contestants.responseCount[message.author.id] === allowedAmount) {
		removeRole(serverId, message.author.id, respondingRemindPing);
	}
	save(`${seasonPath}/seasonContestants.json`, seasonContestants);
	save(`${roundPath}/responses.json`, responses);
	save(`${roundPath}/contestants.json`, contestants);
	return reply;
};
function editResponse(message) {
	logMessage(`Recording response edit by ${message.author}:\n\t${message}`);
	// Find old response
	const authorResponseIndex = responses.findIndex(response => response.author === message.author.id);
	if (authorResponseIndex === -1) {
		return "You have not responded to this prompt!";
	}
	const formerResponse = responses[authorResponseIndex];
	// Check technicals
	const failedTechnical = checkTechnicals(message.content);
	if (failedTechnical !== null) {
		return `Your new response (\`${message}\`) failed the technical "${failedTechnical}".\nYour edit has not been recorded; please submit a new response that follows all technicals.`;
	}
	// Build response object
	let messageData = {
		id: message.id,
		author: message.author.id,
		time: toTimeString(message.createdAt),
		text: message.content,
		dummy: formerResponse.isDummy || undefined,
		edited: true
	};
	if (roundTwists != null) {
		messageData.twist = roundTwists.reduce((message, name) => {
			return twists[name].execute(message);
		}, message.content);
	}
	// Update response
	responses[authorResponseIndex] = messageData;
	save(`${roundPath}/responses.json`, responses);
	return `Your response, formerly \`${formerResponse.text}\`, has been edited to be \`${message.content}\``;
}
function deleteResponse(author) {
	const authorResponseIndex = responses.findIndex(response => response.author === author);
	if (authorResponseIndex === -1) {
		return "You have not responded to this prompt!";
	}
	// Delete response
	const formerResponse = responses[authorResponseIndex].text;
	responses.splice(authorResponseIndex, 1);
	// Update response count
	contestants.responseCount[author]--;
	addRole(serverId, author, respondingRemindPing);
	// Save files
	save(`${roundPath}/responses.json`, responses);
	save(`${roundPath}/contestants.json`, contestants);
	return `Your response, formerly \`${formerResponse}\`, has been successfully deleted.`;
}
Object.assign(exports, {initResponding, checkTechnicals, logResponse, editResponse, deleteResponse});