// Modules
const {twows} = require("./config.json");
const {getTime} = require("./helpers.js");
const technicals = require("./technicals.js");
const twists = require("./twists.js");
// Other variables
let seasonPath = twows[0]; // Only works for a single TWOW.
let seasonData = require(`${seasonPath}/status.json`);
let roundPath = `${seasonPath}/Round ${seasonData.currentRound}`;
let roundData = require(`${roundPath}/data.json`);
let responses = require(`${roundPath}/responses.json`);
// Release prompt
// Record responses
exports.recordResponse = function (user, message) {
	let messageData = {
		time: getTime(message.createdAt),
		text: message.content
	};
	messageData.technical = roundData.technicals.reduce((passes, technical) => {
		return passes && technical.check(message.content);
	}, true);
	messageData.twist = roundData.twists.reduce((message, twist) => {
		return twist.execute(message);
	}, message.content);
	console.log(messageData);
	responses[user].id = messageData;
};