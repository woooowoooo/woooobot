const {colors, optRequire, hasPerms, parseArgs} = require("./helpers.js");
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
			// Sort commands into permission levels
			const rangeNames = ["twow", "season", "round"];
			const ranges = Object.entries(stats).reduce((ranges, [name, command]) => {
				ranges[command.range] ??= [];
				ranges[command.range].push([name, command]);
				return ranges;
			}, {});
			// List commands per level
			let list = `${colors.red}list${colors.white}: ${this.description}\n`;
			for (const range of rangeNames) {
				list += `\n\x1B[1;37m${range.toUpperCase()}-SPECIFIC STATS${colors.reset}\n`;
				for (const [name, {description}] of ranges[range]) {
					list += `${colors.red}${name}${colors.white}: ${description}\n`;
				}
			}
			return `Available statistics: \`\`\`ansi\n${colors.reset}${list}\n\`\`\``;
		}
	},
	// TWOW-specific
	listTWOWContestants: {
		description: "List all unique contestants who have participated in this TWOW",
		permLevel: "normal",
		range: "twow",
		execute: function () {
			const contestants = new Set();
			for (const seasonPath of Object.values(seasons)) {
				const {names} = require(twowPath + seasonPath + "seasonContestants.json");
				Object.values(names).forEach(name => contestants.add(name));
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
			for (const seasonPath of Object.values(seasons)) {
				const {names} = require(twowPath + seasonPath + "seasonContestants.json");
				Object.values(names).forEach(name => contestants.add(name));
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
			const {contestants, names} = require(seasonPath + "seasonContestants.json");
			if (contestants != null) { // EndlessTWOW-specific?
				return contestants.map(id => names[id]);
			}
			return Object.values(names);
		}
	},
	calculateSeasonContestants: {
		description: "Calculate the number of season contestants",
		permLevel: "normal",
		range: "season",
		execute: function () {
			const {names} = require(seasonPath + "seasonContestants.json");
			if (contestants != null) {
				return contestants.length;
			}
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
		description: "List all responses in a round (admin only)",
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
				responseVotes += Object.keys(response.ratings ?? {}).length;
			}
			return responseVotes / responses.length;
		}
	},
	// Contestant-specific
	// Season-specific
	listWins: {
		description: "List all wins in a season",
		permLevel: "normal",
		range: "season",
		execute: function (contestant) {
			const roundsWon = [];
			for (const [round, roundPath] of Object.entries(rounds)) {
				const results = optRequire(seasonPath + roundPath + "results.json");
				if (results != null && results[0].id === contestant) {
					roundsWon.push(round);
				}
			}
			return roundsWon;
		}
	}
};
module.exports = async function (statName, argString, message, roles) {
	// Check if statistic exists
	if (statName == null) {
		throw new Error("Statistic name is missing!");
	}
	if (!(statName in stats)) {
		throw new Error(`Invalid statistic!`);
	}
	const stat = stats[statName];
	// Check permissions
	if (!(await hasPerms(message.author, message.guild, roles, stat.permLevel))) {
		throw new Error("You aren't allowed to see this statistic!");
	}
	// Range stuff
	const args = parseArgs(argString);
	// Execute statistic command
	const result = stat.execute(...args);
	if (Array.isArray(result)) {
		return result.join("\n");
	}
	if (typeof result === "object") {
		return JSON.stringify(result, null, 4); // Discord doesn't support tabs
	}
	return result.toString();
};