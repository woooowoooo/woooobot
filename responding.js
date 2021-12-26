// Modules
const {getTime, logMessage, sendMessage, save} = require("./helpers.js");
const technicals = require("./technicals.js");
const twists = require("./twists.js");
// Data
const {twows, currentTWOW} = require("./config.json");
const twowPath = twows[currentTWOW]; // TODO: Add support for multiple TWOWs
let status = require(`${twowPath}/status.json`);
const {seasons, roles: {alive, remind}, channels: {prompts}} = require(`${twowPath}/twowConfig.json`);
const seasonPath = `${twowPath}/${seasons[status.currentSeason - 1]}`;
const {rounds} = require(`${seasonPath}/seasonConfig.json`);
const roundPath = `${seasonPath}/${rounds[status.currentRound - 1]}`;
const {prompt, deadline, technicals: roundTechnicals, twists: roundTwists} = require(`${roundPath}/roundConfig.json`);
let responses = require(`${roundPath}/responses.json`);
// Functions
exports.initResponding = function () {
	logMessage("Responding period started.");
	status.phase = "responding";
	save(`${twowPath}/status.json`, status);
	sendMessage(prompts, `<@&${alive}> Round ${status.currentRound} Prompt:\`\`\`\n${prompt}\`\`\`Respond to <@814748906046226442> by <t:${deadline}> (<t:${deadline}:R>)`, true);
};
exports.logResponse = function (message) {
	logMessage(`Recording response by ${message.author}:\n${message}`);
	let messageData = {
		id: message.id,
		time: getTime(message.createdAt),
		text: message.content,
		technical: roundTechnicals.reduce((passes, name) => {
			return passes && technicals[name].check(message.content);
		}, true),
		twist: roundTwists.reduce((message, name) => {
			return twists[name].execute(message);
		}, message.content)
	};
	if (messageData.technical === false) {
		return `Your response (\`${message}\`) failed a technical.\nIt has not been recorded; please submit a response that follows all technicals.`;
	}
	responses[message.author.id] = messageData;
	save(`${roundPath}/responses.json`, responses);
	return `Your response (\`${message}\`) has been recorded. Your response is response #${responses.length}`;
};