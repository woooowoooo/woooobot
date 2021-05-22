// Modules
const fs = require("fs").promises;
const {twows} = require("./config.json");
const {getTime} = require("./helpers.js");
const technicals = require("./technicals.js");
const twists = require("./twists.js");
// Other variables
const twowPath = twows["Sample TWOW"]; // Only works for a single TWOW.
const status = require(`${twowPath}/status.json`);
let twowSettings = require(`${twowPath}/twowConfig.json`);
const seasonPath = `${twowPath}/${twowSettings.seasons[status.currentSeason]}`;
let seasonSettings = require(`${seasonPath}/seasonConfig.json`);
const roundPath = `${seasonPath}/${seasonSettings.rounds[status.currentRound]}`;
let roundData = require(`${roundPath}/data.json`);
let responses = require(`${roundPath}/responses.json`);
// Release prompt
// Record responses
module.exports = function (user, message) {
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
};