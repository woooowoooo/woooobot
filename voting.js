// Modules
const {twows} = require("./config.json");
const {logMessage} = require("./helpers.js");
// Other variables
const twowPath = twows["Sample TWOW"]; // Only works for a single TWOW.
const status = require(`${twowPath}/status.json`);
let twowSettings = require(`${twowPath}/twowConfig.json`);
const seasonPath = `${twowPath}/${twowSettings.seasons[status.currentSeason]}`;
let seasonSettings = require(`${seasonPath}/seasonConfig.json`);
const roundPath = `${seasonPath}/${seasonSettings.rounds[status.currentRound]}`;
let roundData = require(`${roundPath}/data.json`);
let responses = require(`${roundPath}/responses.json`);
let votes = require(`${roundPath}/votes.json`);
// Functions
function partitionResponses(responseAmount, min = 7, max = (2 * min - 1), ideal = Math.floor((max + min) / 2)) {
	let screenSizes = [];
	for (let i = 0; responseAmount > ideal; i++) {
		screenSizes[i] = ideal;
		responseAmount -= ideal;
	}
	screenSizes[i] = responseAmount;
	return screenSizes;
}
function createScreen(responses) {
	for (let i = 0; i < responses.length - 1; i++) { // Randomize response array
		let j = Math.floor(Math.random() * i);
		[array[i], array[j]] = [array[j], array[i]];
	}
	let screenSizes = partitionResponses(responses.length);
	logMessage(roundData.prompt);
	logMessage(screenSizes);
}
createScreen(12);
exports.initVoting = function () {
	logMessage("Start voting period here.");
};
exports.logVote = function (message, user) {
	logMessage(`Recording Vote: ${message} by ${user}`);
	votes[user].id = {
		"time": getTime(message), // Doesn't access message time property
		"text": message.content
	};
};