const {twowPath} = require("./config.json");
const {seasonPath} = require(twowPath + "status.json");
const {rounds} = require(seasonPath + "seasonConfig.json");
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
function listSeasonContestants() {
	const {names} = require(seasonPath + "seasonContestants.json");
	for (let name of Object.values(names)) {
		console.log(name);
	}
}
function listStatistics() {
	console.log(`Username|Rank|Score|Standard Deviation|Skew|Verbosity|Sentiment`)
	for (let roundPath of Object.values(rounds)) {
		const results = require(seasonPath + roundPath + "results.json")
		for (let contestant of results) {
			console.log(contestant.name + "|" 
			+ contestant.rank + "|" 
			+ contestant.percentile 
			+ "|" + contestant.stDev 
			+ "|" + contestant.skew 
			+ "|" + contestant.response.length 
			+ "|" + sentiment.analyze(contestant.response).score)
		};
	}
}
listStatistics()