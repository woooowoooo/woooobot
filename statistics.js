const {twowPath} = require("./config.json");
const {seasonPath} = require(twowPath + "status.json");
const {seasons} = require(twowPath + "twowConfig.json");
const {rounds} = require(seasonPath + "seasonConfig.json");
// Season-wide
const stats = {
	listSeasonContestants: {
		execute: function () {
			const {names} = require(seasonPath + "seasonContestants.json");
			for (let name of Object.values(names)) {
				console.log(name);
			}
		}
	},
	listPrompts: {
		execute: function () {
			for (let seasonPath of Object.values(seasons)) {
				const {rounds} = require(twowPath + seasonPath + "seasonConfig.json");
				for (let roundPath of Object.values(rounds)) {
					const {prompt} = require(twowPath + seasonPath + roundPath + "roundConfig.json");
					console.log(prompt);
				}
			}
		}
	},
	// Round-specific
	listContestants: {
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const {responseCount} = require(seasonPath + rounds[round] + "contestants.json");
			for (const id of Object.keys(responseCount)) {
				console.log(names[id]);
			}
		}
	},
	listVoters: {
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(seasonPath + rounds[round] + "votes.json");
			for (const id of Object.keys(votes)) {
				console.log(names[id]);
			}
		}
	},
	listSupervoters: {
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