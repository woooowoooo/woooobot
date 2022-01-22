// Modules
const {logMessage, sendMessage, getTime, toUnixTime, save} = require("./helpers.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const status = require(twowPath + "status.json");
const {seasonPath, roundPath} = status;
const {
	roles: {alive, remind},
	channels: {bots, prompts, reminders: remindersId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {deadlines, reminders} = require(seasonPath + "seasonConfig.json");
const technicals = require(seasonPath + "technicals.js");
const twists = require(seasonPath + "twists.js");
// Round-specific
const {prompt, rDeadline, technicals: roundTechnicals, twists: roundTwists} = require(roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
const responses = require(roundPath + "responses.json");
// Functions
exports.initResponding = function () {
	logMessage("Responding period started.");
	status.phase = "responding";
	save(`${twowPath}/status.json`, status);
	const unixDeadline = toUnixTime(rDeadline);
	sendMessage(prompts, `<@&${alive}> Round ${status.currentRound} Prompt:\`\`\`\n${prompt}\`\`\`Respond to <@814748906046226442> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)`, true);
};
exports.initRound = function () {
	// TODO: Start new round
	// TODO: Create new files
};
exports.logResponse = function (message) {
	logMessage(`Recording response by ${message.author}:\n${message}`);
	const allowed = contestants.prize.includes(message.author.id) ? 2 : 1;
	contestants.responseCount[message.author.id] ??= 0;
	// TODO: Allow edits
	if (contestants.responseCount[message.author.id] >= allowed) {
		return `You have already responded to the prompt!`;
	}
	const passesTechnical = roundTechnicals.reduce((passes, name) => {
		return passes && technicals[name].check(message.content);
	}, true);
	if (!passesTechnical) {
		return `Your response (\`${message}\`) failed a technical.\nIt has not been recorded; please submit a response that follows all technicals.`;
	}
	// TODO: Allow DRPs
	let messageData = {
		id: message.id,
		author: message.author.id,
		time: getTime(message.createdAt),
		text: message.content
	};
	if (roundTwists != null) {
		messageData.twist = roundTwists.reduce((message, name) => {
			return twists[name].execute(message);
		}, message.content);
	}
	responses.push(messageData);
	contestants.responseCount[message.author.id]++;
	save(`${roundPath}/responses.json`, responses);
	save(`${roundPath}/contestants.json`, contestants);
	return `Your response (\`${message}\`) has been recorded. Your response is response #${responses.length}`;
};