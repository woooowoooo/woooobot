const {twowPath} = require("./config.json");
const {seasonPath} = require(twowPath + "status.json");
const {seasons} = require(twowPath + "twowConfig.json");
const {rounds} = require(seasonPath + "seasonConfig.json");
// Season-wide
const stats = {
	list: {
		description: "List all statistics",
		permLevel: "normal",
		range: undefined, // TODO: Work this out
		execute: function () {
			let list = "";
			for (const [name, {description}] of Object.entries(stats)) {
				list += `${name}: ${description}\n`;
			}
			return `Available statistics: \`\`\`${list}\`\`\``;
		}
	},
	// TWOW-specific
	listTWOWContestants: {
		description: "List all unique contestants who have participated in this TWOW",
		permLevel: "normal",
		range: "twow",
		execute: function () {
			const contestants = new Set();
			for (let seasonPath of Object.values(seasons)) {
				const {names} = require(seasonPath + "seasonContestants.json");
				contestants.add(...Object.values(names));
			}
			return [...contestants];
		}
	},
	calculateTWOWContestants: {
		description: "Calculate the number of unique contestants who have participated in this TWOW",
		permLevel: "normal",
		range: "twow",
		execute: function () {
			const contestants = new Set();
			for (let seasonPath of Object.values(seasons)) {
				const {names} = require(seasonPath + "seasonContestants.json");
				contestants.add(...Object.values(names));
			}
			return contestants.size;
		}
	},
	// Season-specific
	listSeasonContestants: {
		description: "List all season contestants",
		permLevel: "normal",
		range: "season",
		execute: function () {
			const {names} = require(seasonPath + "seasonContestants.json");
			return Object.values(names);
		}
	},
	calculateSeasonContestants: {
		description: "Calculate the number of season contestants",
		permLevel: "normal",
		range: "season",
		execute: function () {
			const {names} = require(seasonPath + "seasonContestants.json");
			return Object.keys(names).length;
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
	listContestants: {
		description: "List all contestants in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const {responseCount} = require(seasonPath + rounds[round] + "contestants.json");
			return Object.keys(responseCount).map(id => names[id]);
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
			return responses.map(response => response.text);
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
			return Object.keys(votes).map(id => names[id]);
		}
	},
	listSupervoters: {
		description: "List all supervoters in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(seasonPath + rounds[round] + "votes.json");
			return Object.keys(votes).filter(id => votes[id].supervote).map(id => names[id]);
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
				responseVotes += Object.keys(response.ratings)?.length ?? 0;
			}
			return responseVotes / responses.length;
		}
	}
};
module.exports = stats;