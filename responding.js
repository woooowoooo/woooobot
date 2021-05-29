// Modules
const fs = require("fs").promises;
const {twows} = require("./config.json");
const {getTime, logMessage} = require("./helpers.js");
const technicals = require("./technicals.js");
const twists = require("./twists.js");
// Other variables
const twowPath = twows["Sample TWOW"]; // Only works for a single TWOW.
const status = require(`${twowPath}/status.json`);
let {seasons, channels: {prompts}} = require(`${twowPath}/twowConfig.json`);
const seasonPath = `${twowPath}/${seasons[status.currentSeason]}`;
let {rounds} = require(`${seasonPath}/seasonConfig.json`);
const roundPath = `${seasonPath}/${rounds[status.currentRound]}`;
let roundData = require(`${roundPath}/data.json`);
let responses = require(`${roundPath}/responses.json`);
// Functions
exports.initResponding = function () {
	logMessage("Start responding period here.");
};
exports.logResponse = function (message, user) {
	let messageData = {
		time: getTime(message.createdAt),
		text: message.content
	};
	messageData.technical = roundData.technicals.reduce((passes, name) => {
		return passes && technicals[name].check(message.content);
	}, true);
	messageData.twist = roundData.twists.reduce((message, name) => {
		return twists[name].execute(message);
	}, message.content);
	responses[user.id] = messageData;
	fs.writeFile(`${roundPath}/responses.json`, JSON.stringify(responses, null, '\t'));
	user.client.sendMessage(user.dmChannel, `Your response (\`${message}\`) has been recorded.`);
};