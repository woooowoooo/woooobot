// Modules
const {getTime, logMessage, sendMessage} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {twows, currentTWOW} = require("./config.json");
const twowPath = twows[currentTWOW]; // Only works for a single TWOW.
const status = require(`${twowPath}/status.json`);
const {seasons, channels: {results}} = require(`${twowPath}/twowConfig.json`);
const seasonPath = `${twowPath}/${seasons[status.currentSeason - 1]}`;
const {rounds} = require(`${seasonPath}/seasonConfig.json`);
const roundPath = `${seasonPath}/${rounds[status.currentRound - 1]}`;
let {prompt} = require(`${roundPath}/roundConfig.json`);
let responses = require(`${roundPath}/responses.json`);
let votes = require(`${roundPath}/votes.json`);
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
		[array[i], array[j]] = [array[j], array[i]];
	}
	let screenSizes = partitionResponses(responses.length);
	logMessage(prompt);
	logMessage(screenSizes);
}
exports.initVoting = function () {
	logMessage("Start voting period here.");
	// TODO: Create voting
	createScreen(12);
};
exports.logVote = function (message) {
	logMessage(`Recording Vote: ${message} by ${message.author}`);
	votes[message.author.id].id = {
		"time": getTime(message.createdAt), // Doesn't access message time property
		"text": message.content
	};
};
exports.results = function () {
	// TODO: Create results
	// Spoiler wall
	for (let i = 0; i < 50; i++) {
		sendMessage(results, morshu(1), true);
	}
};