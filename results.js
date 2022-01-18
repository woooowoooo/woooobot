// Modules
const {logMessage, sendMessage} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {automatic, twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const {currentRound, seasonPath, roundPath} = require(twowPath + "status.json");
const {channels: {results: resultsId}} = require(twowPath + "twowConfig.json");
// Season-specific
const {sections: _s, megascreen: _m} = require(seasonPath + "seasonConfig.json");
const {drawResults} = require(seasonPath + "graphics.js");
// Round-specific
const {prompt} = require(roundPath + "roundConfig.json");
const contestants = require(roundPath + "contestants.json");
const responses = require(roundPath + "responses.json");
const votes = require(roundPath + "votes.json");
const {screenSections, screenResponses, sectionScreens} = require(roundPath + "screens.json");
// Results
exports = function () {
	logMessage("Results started.");
	// TODO: Calculate results
	const rankings = [];
	for (const response of responses) {
		const ratings = Array.from(Object.values(response.ratings));
		const percentage = ratings.reduce((a, b) => a + b, 0) / ratings.length;
		const stDev = 0; // TODO: Figure out how to calculate
		const skew = 0; // TODO: Figure out how to calculate
		rankings.push({
			type: "hi", // TODO: Figure out how to calculate
			rank: 0, // TODO: Figure out how to calculate
			book: "path", // TODO: Figure out how to calculate
			name: "name", // TODO: Figure out how to calculate
			response: response.text,
			percentage: percentage * 100,
			stDev: stDev * 100,
			skew: skew,
			votes: ratings.length
		});
	}
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
		// TODO: Use round name
		await drawResults(`${roundPath}/results/${path}`, "Round 1", prompt, rankings, header);
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