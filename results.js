// Modules
const {logMessage, sendMessage, save} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const {currentRound, seasonPath, roundPath} = require(twowPath + "status.json");
const {channels: {results: resultsId}} = require(twowPath + "twowConfig.json");
// Season-specific
const {dangerZone, cutoffs} = require(seasonPath + "seasonConfig.json");
const {names, bookPaths} = require(seasonPath + "seasonContestants.json");
const {drawResults} = require(seasonPath + "graphics.js");
// Round-specific
const {prompt} = require(roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
const responses = require(roundPath + "responses.json");
// Calculate results
function mean(array, map) {
	if (map != null) {
		array = array.map(map);
	}
	return array.reduce((a, b) => a + b, 0) / array.length;
}
function calculateResults() {
	const results = [];
	for (const response of responses) {
		const ratings = Array.from(Object.values(response.ratings));
		const average = mean(ratings);
		const stDev = mean(ratings, rating => (rating - average) ** 2) ** 0.5; // StDevP
		results.push({
			book: bookPaths[response.author],
			id: response.author,
			name: names[response.author],
			response: response.text,
			percentile: average * 100,
			stDev: stDev * 100,
			skew: mean(ratings, rating => (rating - average) ** 3) / stDev ** 3,
			votes: ratings.length
		});
	}
	// Sort results
	results.sort((a, b) => b.percentile - a.percentile || a.skew - b.skew); // Tiebreaker: Smaller skew is better
	const types = dangerZone ? ["alive", "danger", "dead"] : ["alive", "dead"];
	const responders = Object.keys(contestants.responseCount).length;
	const placed = new Set();
	let rank = 1;
	for (const result of results) {
		// TODO: Add check for dummies
		if (placed.has(result.id)) {
			result.type = "drp";
			continue;
		}
		placed.add(result.id);
		let type = "prize";
		for (const i in cutoffs) {
			if (rank > Math.round(cutoffs[i] * responders)) {
				type = types[i];
			}
		}
		result.type = type;
		result.rank = rank;
		rank++;
	}
	save(roundPath + "results.json", results);
	return results;
}
// Present results
const stdin = process.openStdin();
async function sendSlide(path, rankings, header) {
	await drawResults(`${roundPath}results/${path}`, currentRound, prompt, rankings, header);
	await sendMessage(resultsId, {
		files: [{
			attachment: `${roundPath}results/${path}`,
			name: path
		}]
	}, true);
}
async function reveal(rankings, slide) {
	// Enter to reveal
	return new Promise(resolve => {
		stdin.once("data", async function (line) { // TODO: Temporarily remove console listener
			line = line.toString().trim().split(" ");
			if (line[0] === "end") {
				resolve(false);
				return;
			}
			// Choose which rows to show
			const selection = [];
			for (const token of line) {
				if (token.includes("-")) { // Token is a range
					const start = rankings.findIndex(row => row.rank === parseInt(token.split("-")[0]));
					const end = rankings.findIndex(row => row.rank === parseInt(token.split("-")[1]));
					let range = rankings.slice(start, end + 1);
					if (token.at(-1) === "f") { // Filter out DRPs
						range = range.filter(row => row.type !== "drp");
					}
					selection.push(...range);
				} else { // Token is a single row
					selection.push(rankings.find(row => row.rank === parseInt(token)));
				}
			}
			// Create and send slide
			const path = `slide${slide}.png`;
			await sendSlide(path, selection, (slide === 1));
			slide++;
			resolve(true);
		});
	});
}
exports.results = async function () {
	logMessage("Results started.");
	sendMessage(resultsId, `@everyone ${currentRound} Results`);
	const rankings = calculateResults();
	// Reveal results
	let slide = 1;
	while (await reveal(rankings, slide)) {
		slide++;
	}
	// Full leaderboard
	const path = `leaderboard.png`;
	await sendSlide(path, rankings, true); // Why is this sending last?
	// Spoiler wall
	for (let _ = 0; _ < 50; _++) {
		await sendMessage(resultsId, morshu(1), true);
	}
};