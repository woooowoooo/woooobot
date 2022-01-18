// Modules
const {logMessage, sendMessage} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {automatic, twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const {currentRound, seasonPath, roundPath} = require(twowPath + "status.json");
const {channels: {results: resultsId}} = require(twowPath + "twowConfig.json");
// Season-specific
const {names, bookPaths} = require(seasonPath + "seasonContestants.json");
const {drawResults} = require(seasonPath + "graphics.js");
// Round-specific
const {prompt} = require(roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
const responses = require(roundPath + "responses.json");
// Results
function mean(array, map) {
	if (map != null) {
		array = array.map(map);
	}
	return array.reduce((a, b) => a + b, 0) / array.length;
}
function calculateResults() {
	// TODO: Calculate results
	const results = [];
	for (const response of responses) {
		const ratings = Array.from(Object.values(response.ratings));
		const average = mean(ratings);
		const stDev = mean(ratings, rating => (rating - average) ** 2) ** 0.5; // StDevP
		results.push({
			type: "hi", // TODO: Figure out how to calculate
			book: `${seasonPath}books/${bookPaths[response.author]}`,
			name: names[response.author],
			response: response.text,
			percentile: average * 100,
			stDev: stDev * 100,
			skew: mean(ratings, rating => (rating - average) ** 3) / stDev ** 3,
			votes: ratings.length
		});
	}
	// TODO: Sort results
	results.sort((a, b) => b.percentile - a.percentile);
	const placed = new Set();
	for (const i in results) {
		if (placed.has(results[i].name)) {
			results[i].type = "drp";
		} else {
			placed.add(results[i].name);
		}
		results[i].rank = i + 1;
	}
	return results;
}
exports = function () {
	logMessage("Results started.");
	sendMessage(resultsId, `@everyone ${currentRound} Results`);
	const rankings = calculateResults();
	// Reveal results
	async function revealSlide(line) {
		line = line.toString().trim();
		if (line === "stop") {
			stdin.removeListener("data", revealSlide);
			// Full leaderboard
			const path = `leaderboard.png`;
			await sendSlide(path, true);
			// Spoiler wall
			for (let i = 0; i < 50; i++) {
				sendMessage(resultsId, morshu(1), true);
			}
			return;
		}
		const path = `slide${slide}.png`;
		await sendSlide(path, (slide === 1));
		slide++;
	}
	async function sendSlide(path, header) {
		await drawResults(`${roundPath}/results/${path}`, currentRound, prompt, rankings, header);
		sendMessage(resultsId, {
			files: [{
				attachment: `${roundPath}/results/${path}`,
				name: path
			}]
		}, true);
	}
	let slide = 1;
	let stdin = process.openStdin();
	stdin.addListener("data", revealSlide); // Enter to reveal
};