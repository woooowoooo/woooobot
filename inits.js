// Modules
const fs = require("fs").promises;
const {logMessage, getTime, toUnixTime, save} = require("./helpers.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const status = require(twowPath + "status.json");
let {currentSeason, currentRound, seasonPath, roundPath} = status;
const {seasons} = require(twowPath + "twowConfig.json");
// Season-specific
const {rounds} = require(seasonPath + "seasonConfig.json");
const seasonConfig = require(seasonPath + "seasonConfig.json");
const seasonContestants = require(seasonPath + "seasonContestants.json");
// Round-specific
const roundConfig = require(roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
async function newRound() {
	// Create new files
	await fs.mkdir(roundPath);
	await fs.mkdir(roundPath + "results/");
	await fs.mkdir(roundPath + "screens/");
	roundConfig.round = currentRound;
	roundConfig.prompt = "";
	roundConfig.rDeadline = getTime(toUnixTime(roundConfig.vDeadline) + seasonConfig.deadlines[0] * 86400);
	roundConfig.vDeadline = getTime(toUnixTime(roundConfig.rDeadline) + seasonConfig.deadlines[1] * 86400);
	await save(roundPath + "roundConfig.json", roundConfig);
	contestants.responseCount = {};
	await save(roundPath + "contestants.json", contestants);
	await save(roundPath + "responses.json", []);
	await save(roundPath + "votes.json", {});
	await save(roundPath + "screens.json", {});
}
exports.initRound = async function () {
	// Start new round
	// const oldPath = roundPath;
	const roundNames = Object.keys(rounds);
	currentRound = roundNames[roundNames.indexOf(currentRound) + 1];
	roundPath = seasonPath + rounds[currentRound];
	status.currentRound = currentRound;
	status.roundPath = roundPath;
	await save(twowPath + "status.json", status);
	logMessage("New round started: " + currentRound);
	await newRound();
};
exports.initSeason = async function () {
	// Start new season
	const seasonNames = Object.keys(seasons);
	currentSeason = seasonNames[seasonNames.indexOf(currentSeason) + 1];
	seasonPath = twowPath + seasons[currentSeason];
	currentRound = "Round 1";
	roundPath = seasonPath + "Round 1/";
	status.currentSeason = currentSeason;
	status.seasonPath = seasonPath;
	status.currentRound = currentRound;
	status.roundPath = roundPath; // Maybe combine last few lines with double assignments?
	await save(twowPath + "status.json", status);
	logMessage("New season started: " + currentSeason);
	// TODO: Create new files
	await fs.mkdir(seasonPath);
	await fs.mkdir(seasonPath + "books/");
	// Start Round 1
	newRound();
	// TODO: Specific changes for Round 1
};