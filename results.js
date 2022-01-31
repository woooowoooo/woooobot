// Modules
const {client} = require("./index.js");
const {logMessage, sendMessage, save} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const {currentRound, seasonPath, roundPath} = require(twowPath + "status.json");
const {
	id: serverId,
	channels: {results: resultsId},
	roles: {prize, supervoter, alive, dead}
} = require(twowPath + "twowConfig.json");
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
			dummy: response.dummy,
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
		if (result.dummy) {
			result.type = "dummy";
			continue;
		}
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
	return {results, placed}; // Return placed to find DNPs
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
async function reveal(rankings, slide, data) {
	const line = data.toString().trim().split(" ");
	if (line[0] === "end") {
		return false;
	}
	// Choose which rows to show
	const selection = [];
	for (const token of line) {
		if (token.includes("-")) { // Token is a range
			const start = rankings.findIndex(row => row.rank === parseInt(token.split("-")[0]));
			const end = rankings.findIndex(row => row.rank === parseInt(token.split("-")[1]));
			let range = rankings.slice((start !== -1 ? start : 0), (end !== -1 ? end + 1 : rankings.length));
			if (token.at(-1) === "f") { // Filter out DRPs
				range = range.filter(row => row.type !== "drp");
			}
			selection.push(...range);
		} else { // Token is a single row
			selection.push(rankings.find(row => row.rank === parseInt(token)));
		}
	}
	await sendSlide(`slide${slide}.png`, selection, (slide === 1));
	return true;
}
exports.results = async function () {
	logMessage("Results started.");
	sendMessage(resultsId, `@everyone ${currentRound} Results`);
	const {results: rankings, placed: responders} = calculateResults();
	// Reveal results
	let slide = 1;
	let moreSlides = true;
	const consoleListener = stdin.listeners("data")[1];
	stdin.removeListener("data", consoleListener);
	while (moreSlides) {
		moreSlides = await new Promise(resolve => {
			stdin.once("data", async data => resolve(await reveal(rankings, slide, data)));
		});
		slide++;
	}
	stdin.addListener("data", consoleListener);
	// Full leaderboard
	const path = `leaderboard.png`;
	await sendSlide(path, rankings, true);
	// Spoiler wall
	for (let _ = 0; _ < 50; _++) {
		await sendMessage(resultsId, morshu(1), true);
	}
	// Reset contestants.json
	contestants.dnp = [...contestants.prize, ...contestants.alive].filter(id => !responders.has(id));
	contestants.prize = [];
	contestants.alive = [];
	contestants.dead = [];
	// Assign roles
	const twow = await client.guilds.fetch(serverId);
	for (const row of rankings.filter(row => row.type !== "drp" && row.type !== "dummy")) {
		const author = await twow.members.fetch(row.id);
		author.roles.remove(supervoter);
		if (row.type === "dead") {
			author.roles.remove([prize, alive]);
			author.roles.add(dead);
		} else if (row.type === "prize") {
			author.roles.add(prize);
		} else { // "alive" or "danger"
			author.roles.remove(prize);
		}
		contestants[row.type].push(author);
	}
	save(roundPath + "contestants.json", contestants);
};