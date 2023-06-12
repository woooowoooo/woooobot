const {twowPath} = require("./config.json");
const {seasonPath} = require(twowPath + "status.json");
const {seasons} = require(twowPath + "twowConfig.json");
const {rounds} = require(seasonPath + "seasonConfig.json");
// Season-wide
const stats = {
	listSeasonContestants: {
		description: "List all season contestants",
		permLevel: "normal",
		range: "season",
		execute: function () {
			const {names} = require(seasonPath + "seasonContestants.json");
			for (let name of Object.values(names)) {
				console.log(name);
			}
		}
	},
	// Round-specific
	prompt: {
		description: "Return round prompt",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {prompt} = require(seasonPath + rounds[round] + "roundConfig.json");
			return prompt;
		}
	},
	// Round-specific
	listContestants: {
		description: "List all contestants in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const {responseCount} = require(seasonPath + rounds[round] + "contestants.json");
			for (const id of Object.keys(responseCount)) {
				console.log(names[id]);
			}
		}
	},
	calculateContestants: {
		description: "Calculate the number of contestants in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {responseCount} = require(seasonPath + rounds[round] + "contestants.json");
			return Object.keys(responseCount).length;
		}
	},
	listResponses: {
		description: "List all responses in a round",
		permLevel: "admin",
		range: "round",
		execute: function (round) {
			const responses = require(seasonPath + rounds[round] + "responses.json");
			for (const response of responses) {
				console.log(response.text);
			}
		}
	},
	calculateResponses: {
		description: "Calculate the number of responses in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const responses = require(seasonPath + rounds[round] + "responses.json");
			return responses.length;
		}
	},
	listVoters: {
		description: "List all voters in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(seasonPath + rounds[round] + "votes.json");
			for (const id of Object.keys(votes)) {
				console.log(names[id]);
			}
		}
	},
	listSupervoters: {
		description: "List all supervoters in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(seasonPath + rounds[round] + "votes.json");
			for (const [id, vote] of Object.entries(votes)) {
				if (vote.supervote) {
					console.log(names[id]);
				}
			}
		}
	},
	calculateVPR: {
		description: "Calculate the average number of votes per response in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const responses = require(seasonPath + rounds[round] + "responses.json");
			let responseVotes = 0;
			for (const response of responses) {
				responseVotes += Object.keys(response.ratings ?? {}).length;
			}
			return responseVotes / responses.length;
		}
	}
};
module.exports = stats;