const {twowPath} = require("./config.json");
const {seasonPath} = require(twowPath + "status.json");
const {seasons} = require(twowPath + "twowConfig.json");
const {rounds} = require(seasonPath + "seasonConfig.json");
function listSeasonContestants() {
	const {names} = require(seasonPath + "seasonContestants.json");
	for (let name of Object.values(names)) {
		console.log(name);
	}
}
function listRoundContestants(round) {
	const {names} = require(seasonPath + "seasonContestants.json");
	const {responseCount} = require(seasonPath + rounds[round] + "contestants.json");
	for (let id of Object.keys(responseCount)) {
		console.log(names[id]);
	}
}
function listPrompts() {
	for (let seasonPatha of Object.values(seasons)) {
		const {rounds} = require(twowPath + seasonPatha + "seasonConfig.json");
		for (let roundPath of Object.values(rounds)) {
			const {prompt} = require(twowPath + seasonPatha + roundPath + "roundConfig.json");
			console.log(prompt);
		}
	}
}
