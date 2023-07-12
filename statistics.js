const {colors, optRequire, hasPerms, parseArgs} = require("./helpers.js");
const {twowPath} = require("./config.json");
const {currentRound, seasonPath} = require(twowPath + "status.json");
const {seasons} = require(twowPath + "twowConfig.json");
const {rounds} = require(seasonPath + "seasonConfig.json");
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
	twowContestants: {
		description: "Return all unique contestants who have participated in this TWOW",
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
	// Season-specific
	seasonContestants: {
		description: "Return all season contestants",
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
	contestants: {
		description: "Return all contestants in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const {responseCount} = require(seasonPath + rounds[round] + "contestants.json");
			return Object.keys(responseCount).map(id => names[id]);
		}
	},
	responses: {
		description: "Return all responses in a round (admin only)",
		permLevel: "admin",
		range: "round",
		execute: function (round) {
			const responses = require(seasonPath + rounds[round] + "responses.json");
			return responses.map(response => response.text);
		}
	},
	voters: {
		description: "Return all voters in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(seasonPath + rounds[round] + "votes.json");
			return Object.keys(votes).map(id => names[id]);
		}
	},
	supervoters: {
		description: "Return all supervoters in a round",
		permLevel: "normal",
		range: "round",
		execute: function (round) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(seasonPath + rounds[round] + "votes.json");
			return Object.keys(votes).filter(id => votes[id].supervote).map(id => names[id]);
		}
	},
	vpr: {
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
	wins: {
		description: "Return all wins in a season",
		permLevel: "normal",
		range: "season",
		execute: function (_, contestant) {
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
const processors = {
	size: result => result?.length ?? result?.size ?? undefined
};
function selectRounds(rounds, line) {
	const selection = [];
	const roundNames = Object.keys(rounds);
	const tokens = parseArgs(line); // Quite buggy
	for (const token of tokens) {
		if (token.includes("-")) { // Token is a range
			const start = roundNames.findIndex(roundName => roundName === token.split("-")[0]);
			const end = roundNames.findIndex(roundName => roundName === token.split("-")[1]);
			selection.push(...roundNames.slice(start, end + 1));
		} else {
			selection.push(token);
		}
	}
	return selection;
}
async function calcStat(statName, text, message, roles) {
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
	// Get round range
	const [rangeString, args, processor] = text.split("|").map(arg => arg.trim()); // Ignores further pipes, no need demonstrated
	const range = selectRounds(rounds, rangeString || `"${currentRound}"`); // || so empty string defaults to current round, quotes to get around `parseArgs`
	// Execute statistic commands
	let result = [];
	for (const round of range) {
		let output = stat.execute(round, ...parseArgs(args));
		// Process result
		if (processor != null) {
			if (!(processor in processors)) {
				throw new Error("Invalid processor!");
			}
			output = processors[processor](output);
		}
		result.push(output);
	}
	// Stringify result
	if (result.length === 1) {
		result = result[0];
	}
	if (Array.isArray(result)) {
		return result.join("\n");
	}
	if (typeof result === "object") {
		return `\`\`\`\n${JSON.stringify(result, null, "\t")}\`\`\``;
	}
	return result.toString();
};
Object.assign(module.exports, {stats, calcStat});