// Modules
// const {client} = require("./index.js");
const {logMessage, sendMessage, addRole, removeRole, toTimeString, toUnixTime, defaultRequire, optRequire, save} = require("./helpers.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const status = require(twowPath + "status.json");
const {seasonPath, roundPath} = status;
const {
	id: serverId,
	roles: {alive: aliveId, respondingRemind, respondingPing, votingPing, resultsPing},
	channels: {bots, prompts, reminders: remindersId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {deadlines, reminders} = require(seasonPath + "seasonConfig.json");
const seasonContestants = require(seasonPath + "seasonContestants.json");
const technicals = optRequire(seasonPath + "technicals.js");
const twists = optRequire(seasonPath + "twists.js");
// Round-specific
const {prompt, example, rDeadline, technicals: roundTechnicals = [], twists: roundTwists} = require(roundPath + "roundConfig.json");
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
	await sendMessage(prompts, `<@&${joins ? respondingPing : aliveId}> ${status.currentRound} Prompt:\`\`\`\n${prompt}\`\`\`Respond to <@814748906046226442> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)${example ? `\nHere's an example response: \`${example}\`` : ""}`, true);
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
function logResponse(message) {
	// Reject extra responses and determine dummies
	// TODO: Allow edits
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
		dummy: isDummy
	};
	if (roundTwists != null) {
		messageData.twist = roundTwists.reduce((message, name) => {
			return twists[name].execute(message);
		}, message.content);
	}
	responses.push(messageData);
	// Initialize first-time responders
	if (!alive && joins) {
		seasonContestants.names[message.author.id] = message.author.username;
		contestants.alive.push(message.author.id);
		addRole(serverId, message.author.id, aliveId);
		addRole(serverId, message.author.id, respondingPing);
		addRole(serverId, message.author.id, votingPing);
		addRole(serverId, message.author.id, resultsPing);
	}
	// Remove responders from reminders
	contestants.responseCount[message.author.id] ??= 0;
	contestants.responseCount[message.author.id]++;
	if (contestants.responseCount[message.author.id] === allowedAmount) {
		removeRole(serverId, message.author.id, respondingRemind);
	}
	save(`${seasonPath}/seasonContestants.json`, seasonContestants);
	save(`${roundPath}/responses.json`, responses);
	save(`${roundPath}/contestants.json`, contestants);
	return `Your response (\`${message}\`) has been recorded${isDummy ? " as a dummy. **This means that its placement in results does not matter.**" : "."} Your response is response #${responses.length}`;
};
Object.assign(exports, {initResponding, checkTechnicals, logResponse});