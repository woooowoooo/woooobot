const {colors, optRequire, hasPerms, parseArgs} = require("./helpers.js");
const {twowPath} = require("./config.json");
const {currentSeason, currentRound, seasonPath} = require(twowPath + "status.json");
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
	seasons: {
		description: "Return all seasons",
		permLevel: "normal",
		range: "twow",
		execute: function () {
			return Object.keys(seasons);
		}
	},
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
	rounds: {
		description: "Return all rounds in a season",
		permLevel: "normal",
		range: "season",
		execute: function ({seasonPath}) {
			const {rounds} = require(seasonPath + "seasonConfig.json");
			return Object.keys(rounds);
		}
	},
	seasonContestants: {
		description: "Return all season contestants",
		permLevel: "normal",
		range: "season",
		execute: function ({seasonPath}) {
			const {contestants, names} = require(seasonPath + "seasonContestants.json");
			if (contestants != null) { // EndlessTWOW-specific?
				return contestants.map(id => names[id]);
			}
			return Object.values(names);
		}
	},
	// Round-specific
	return: {
		description: "Return property of round",
		permLevel: "developer",
		range: "round",
		execute: function ({roundPath}, path, keyString = "") { // Largely similar to the command `return`, but more convenient for statistics
			// Get file from path
			if (/\.\.\//.test(path)) {
				throw new Error("You can't view values above round level!");
			}
			const file = require(roundPath + path);
			// Traverse through keys
			const keys = keyString.split(".").filter(key => key !== "");
			return keys.reduce((object, key) => {
				if (!(key in object)) {
					throw new Error(`Key \`${key}\` not found!`);
				}
				return object[key];
			}, file);
		}
	},
	prompt: {
		description: "Return round prompt",
		permLevel: "normal",
		range: "round",
		execute: function ({roundPath}) {
			const {prompt} = require(roundPath + "roundConfig.json");
			return prompt;
		}
	},
	contestants: {
		description: "Return all contestants in a round",
		permLevel: "normal",
		range: "round",
		execute: function ({roundPath}) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const {responseCount} = require(roundPath + "contestants.json");
			return Object.keys(responseCount).map(id => names[id]);
		}
	},
	responses: {
		description: "Return all responses in a round (admin only)",
		permLevel: "admin",
		range: "round",
		execute: function ({roundPath}) {
			const responses = require(roundPath + "responses.json");
			return responses.map(response => response.text);
		}
	},
	voters: {
		description: "Return all voters in a round",
		permLevel: "normal",
		range: "round",
		execute: function ({seasonPath, roundPath}) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(roundPath + "votes.json");
			return Object.keys(votes).map(id => names[id]);
		}
	},
	supervoters: {
		description: "Return all supervoters in a round",
		permLevel: "normal",
		range: "round",
		execute: function ({seasonPath, roundPath}) {
			const {names} = require(seasonPath + "seasonContestants.json");
			const votes = require(roundPath + "votes.json");
			return Object.keys(votes).filter(id => votes[id].supervote).map(id => names[id]);
		}
	},
	vpr: {
		description: "Calculate the average number of votes per response in a round",
		permLevel: "normal",
		range: "round",
		execute: function ({roundPath}) {
			const responses = require(roundPath + "responses.json");
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
		execute: function ({seasonPath}, contestant) {
			const {rounds} = require(seasonPath + "seasonConfig.json");
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
	amount: result => result?.length ?? result?.size ?? undefined
};
function selectEntries(entries, line) {
	const selection = [];
	const entryNames = Object.keys(entries);
	const tokens = parseArgs(line);
	for (const token of tokens) {
		switch (token) {
			case "first":
				selection.push(entryNames[0]);
				break;
			case "previous":
				if (entryNames.length < 2) {
					throw new Error("There is no previous entry!");
				}
				selection.push(entryNames[entryNames.length - 2]);
				break;
			case "current":
				selection.push(entryNames[entryNames.length - 1]);
				break;
			case token.includes("-"): // Token is a range
				const start = entryNames.findIndex(entryName => entryName === token.split("-")[0]);
				const end = entryNames.findIndex(entryName => entryName === token.split("-")[1]);
				selection.push(...entryNames.slice(start, end + 1));
				break;
			default:
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
	// Get entry range
	const [rangeString, args, processor] = text.split("|").map(arg => arg.trim()); // Ignores further pipes, no need demonstrated
	const entries = stat.range === "round" ? rounds : seasons;
	const range = selectEntries(entries, rangeString || "current"); // "||" so empty string defaults to current round
	// Check if processor exists
	if (processor != null && !(processor in processors)) {
		throw new Error("Invalid processor!");
	}
	// Check if all entries are valid
	if (!range.every(entry => entry in entries)) {
		throw new Error(`Invalid ${stat.range} name!`);
	}
	// Execute statistic commands
	let result = [];
	for (const entry of range) {
		// Get paths
		const paths = {};
		if (stat.range === "round") {
			paths.seasonPath = seasonPath;
			paths.roundPath = seasonPath + rounds[entry];
		} else {
			paths.seasonPath = twowPath + seasons[entry];
		}
		// Execute command
		let output = stat.execute(paths, ...parseArgs(args));
		// Process result
		if (processor != null) {
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
		return `\`\`\`json\n${JSON.stringify(result, null, "\t")}\`\`\``;
	}
	return result.toString();
};
Object.assign(module.exports, {stats, calcStat});