// Modules
const {logMessage, sendMessage, getTime, toUnixTime, save} = require("./helpers.js");
const technicals = require("./technicals.js");
const twists = require("./twists.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
let status = require(twowPath + "status.json");
const {seasonPath, roundPath} = status;
const {
	roles: {alive, remind},
	channels: {bots, prompts, reminders: remindersId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {deadlines, reminders} = require(seasonPath + "seasonConfig.json");
// Round-specific
const {prompt, rDeadline, technicals: roundTechnicals, twists: roundTwists} = require(roundPath + "roundConfig.json");
let responses = require(roundPath + "responses.json");
// Functions
exports.initResponding = function () {
	logMessage("Responding period started.");
	status.phase = "responding";
	save(`${twowPath}/status.json`, status);
	const unixDeadline = toUnixTime(rDeadline);
	sendMessage(prompts, `<@&${alive}> Round ${status.currentRound} Prompt:\`\`\`\n${prompt}\`\`\`Respond to <@814748906046226442> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)`, true);
};
exports.logResponse = function (message) {
	logMessage(`Recording response by ${message.author}:\n${message}`);
	let messageData = {
		author: message.author.id,
		time: getTime(message.createdAt),
		text: message.content
	};
	if (roundTwists != null) {
		messageData.twist = roundTwists.reduce((message, name) => {
			return twists[name].execute(message);
		}, message.content);
	}
	responses[message.id] = messageData;
	save(`${roundPath}/responses.json`, responses);
	return `Your response (\`${message}\`) has been recorded. Your response is response #${Object.keys(responses).length - 1}`; // Subtract "version"
};