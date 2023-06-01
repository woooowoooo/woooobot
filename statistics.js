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
function listPrompts() {
	for (let seasonPath of Object.values(seasons)) {
		const {rounds} = require(twowPath + seasonPath + "seasonConfig.json");
		for (let roundPath of Object.values(rounds)) {
			const {prompt} = require(twowPath + seasonPath + roundPath + "roundConfig.json");
			console.log(prompt);
		}
	}
}
// Round-specific
function listContestants(round) {
	const {names} = require(seasonPath + "seasonContestants.json");
	const {responseCount} = require(seasonPath + rounds[round] + "contestants.json");
	for (const id of Object.keys(responseCount)) {
		console.log(names[id]);
	}
}
function listVoters(round) {
	const {names} = require(seasonPath + "seasonContestants.json");
	const votes = require(seasonPath + rounds[round] + "votes.json");
	for (const id of Object.keys(votes)) {
		console.log(names[id]);
	}
}
function listSupervoters(round) {
	const {names} = require(seasonPath + "seasonContestants.json");
	const votes = require(seasonPath + rounds[round] + "votes.json");
	for (const [id, vote] of Object.entries(votes)) {
		if (vote.supervote) {
			console.log(names[id]);
		}
	}
}
function calculateVPR(round) {
	const responses = require(seasonPath + rounds[round] + "responses.json");
	let responseVotes = 0;
	for (const response of responses) {
		responseVotes += Object.keys(response.ratings ?? {}).length;
	}
	return responseVotes / responses.length;
}
Object.assign(exports, {
	listSeasonContestants, listPrompts,
	listContestants, listVoters, listSupervoters, calculateVPR
});