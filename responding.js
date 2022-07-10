// Modules
// const {client} = require("./index.js");
const {logMessage, sendMessage, addRole, getTime, toUnixTime, optRequire, save} = require("./helpers.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const status = require(twowPath + "status.json");
const {seasonPath, roundPath} = status;
const {
	id: serverId,
	roles: {alive: aliveId, noRemind},
	channels: {bots, prompts, reminders: remindersId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {deadlines, reminders, joins: _j, dummies: _d} = require(seasonPath + "seasonConfig.json");
const technicals = optRequire(seasonPath + "technicals.js");
const twists = optRequire(seasonPath + "twists.js");
// Round-specific
const {prompt, example, rDeadline, technicals: roundTechnicals = [], twists: roundTwists, joins = _j, dummies = _d} = require(roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
const responses = require(roundPath + "responses.json");
// Sanity check
if (technicals == null && roundTechnicals.filter(tech => tech !== "noTenWord").length > 0) {
	throw Error(`Round includes technicals ${roundTechnicals} but does not define them!`);
}
if (twists == null && roundTwists != null) {
	throw Error(`Round includes twists ${roundTwists} but does not define them!`);
}
// Functions
exports.initResponding = async function () {
	logMessage("Responding period started.");
	status.phase = "responding";
	await save(`${twowPath}/status.json`, status);
	const unixDeadline = toUnixTime(rDeadline);
	await sendMessage(prompts, `<@&${aliveId}> ${status.currentRound} Prompt:\`\`\`\n${prompt}\`\`\`Respond to <@814748906046226442> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)\nHere's an example response: \`${example ?? ""}\``, true);
	// TODO: Send reminders
	/* for (let reminder in reminders) {
		const date = new Date((unixDeadline - reminders[reminder] * 3600) * 1000);
		if (date.getTime() > Date.now()) {
			const reminderBotTime = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}-${date.toISOString().substring(11, 19)}`;
			// TODO: Non-hardcoded bot channel
			sendMessage(bots[3], `$r <#${remindersId}> ${reminderBotTime} <@&${aliveId}> You have ${reminder} left to respond to the prompt!`, true);
		}
	}; */
};
exports.logResponse = function (message) {
	// Reject extra responses and determine dummies
	// TODO: Allow edits
	logMessage(`Recording response by ${message.author}:\n\t${message}`);
	const prized = contestants.prize.includes(message.author.id);
	const alive = contestants.alive.includes(message.author.id);
	const allowed = prized ? 3 : 2; // Temporary edit for this season
	const isAllowed = (contestants.responseCount[message.author.id] ?? 0) < allowed;
	let isDummy = false;
	if (!prized && !alive && !joins || !isAllowed) {
		if (!dummies) {
			if (prized || alive) {
				return `You have already responded to the prompt!`;
			}
			return "Non-contestant responses are currently not accepted.";
		}
		isDummy = true;
	}
	// Default tenWords technical
	function tenWord(response) {
		return response.split(/\s/).filter(word => /\w/.test(word)).length <= 10; // Don't count punctuation-only "words"
	}
	let passesTechnicals = roundTechnicals.includes("noTenWord") ? true : tenWord(message.content);
	// Check other technicals
	passesTechnicals ||= roundTechnicals.reduce((passes, name) => {
		return passes && technicals[name].check(message.content);
	}, true);
	if (!passesTechnicals) {
		return `Your response (\`${message}\`) failed a technical.\nIt has not been recorded; please submit a response that follows all technicals.`;
	}
	// Build response object
	let messageData = {
		id: message.id,
		author: message.author.id,
		time: getTime(message.createdAt),
		text: message.content,
		dummy: isDummy
	};
	if (roundTwists != null) {
		messageData.twist = roundTwists.reduce((message, name) => {
			return twists[name].execute(message);
		}, message.content);
	}
	responses.push(messageData);
	// Stuff
	if (status.currentRound === "Round 1") { // TODO: Allow rejoin rounds
		// Do Round 1 stuff
		contestants.alive.push(message.author.id);
		addRole(serverId, message.author.id, aliveId);
	}
	contestants.responseCount[message.author.id] ??= 0;
	contestants.responseCount[message.author.id]++;
	if (contestants.responseCount[message.author.id] === allowed) {
		addRole(serverId, message.author.id, noRemind);
	}
	save(`${roundPath}/responses.json`, responses);
	save(`${roundPath}/contestants.json`, contestants);
	return `Your response (\`${message}\`) has been recorded${isDummy ? " as a dummy. **This means that its placement in results does not matter.**" : "."} Your response is response #${responses.length}`;
};