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
	console.log(`Username\tRank\tScore\tStandard Deviation\tSkew\tVerbosity\tSentiment`)
	for (let roundPath of Object.values(rounds)) {
		const results = require(seasonPath + roundPath + "results.json")
		for (let contestant of results) {
			console.log(contestant.name + "\t" 
			+ contestant.rank + "\t" 
			+ contestant.percentile 
			+ "\t" + contestant.stDev 
			+ "\t" + contestant.skew 
			+ "\t" + contestant.response.length 
			+ "\t" + sentiment.analyze(contestant.response).score)
		};
	}
}
listStatistics()