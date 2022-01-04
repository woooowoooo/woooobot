// Modules
const {logMessage, sendMessage, getTime, toUnixTime, save} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
let status = require(twowPath + "status.json");
const {currentRound, seasonPath, roundPath} = status;
const {
	roles: {alive, remind},
	channels: {bots, voting, reminders: remindersId, results: resultsId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {reminders, sections: _s, megascreen: _m} = require(seasonPath + "seasonConfig.json");
const {drawScreen, drawResults} = require(seasonPath + "graphics.js");
// Round-specific
// TODO: Find a better way to do destructuring assignment with a collective default value
const {prompt, vDeadline, keywords, sections = _s, megascreen = _m} = require(roundPath + "roundConfig.json");
let responses = require(roundPath + "responses.json");
let votes = require(roundPath + "votes.json");
// Functions
function partitionResponses(responseAmount, min = 7, max = (2 * min - 1), ideal = Math.floor((max + min) / 2)) {
	let screenSizes = [];
	let i = 0;
	while (responseAmount > ideal) {
		screenSizes[i] = ideal;
		responseAmount -= ideal;
		i++;
	}
	screenSizes[i] = responseAmount;
	return screenSizes;
}
function createScreen(responses) {
	for (let i = 0; i < responses.length - 1; i++) { // Randomize response array
		let j = Math.floor(Math.random() * i);
		[responses[i], responses[j]] = [responses[j], responses[i]];
	}
	let screenSizes = partitionResponses(responses.length);
	logMessage(prompt);
	logMessage(screenSizes);
}
exports.initVoting = function () {
	// TODO: Create voting
	createScreen(12);
	logMessage("Voting period started.");
	status.phase = "voting";
	save(`${twowPath}/status.json`, status);
};
exports.logVote = function (message) {
	votes[message.author.id].id = {
		"time": getTime(message.createdAt), // Doesn't access message time property
		"text": message.content
	logMessage(`Recording vote by ${message.author}:\n${message}`);
	};
};
exports.results = function () {
	// TODO: Create results
	// Spoiler wall
	for (let i = 0; i < 50; i++) {
		sendMessage(results, morshu(1), true);
	}
};