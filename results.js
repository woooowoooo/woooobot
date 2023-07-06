// Modules
const {ActivityType} = require("discord.js");
const {client, listeners} = require("./index.js");
const {logMessage, sendMessage, reload, save} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
const {currentRound: currentRegularRound, currentVotingRound, seasonPath, roundPath: regularRoundPath, votingRoundPath, phase} = require(twowPath + "status.json");
const currentRound = phase === "both" ? currentVotingRound : currentRegularRound;
const roundPath = phase === "both" ? votingRoundPath : regularRoundPath;
const {
	id: serverId,
	channels: {results: resultsId, leaderboards},
	roles: {prize, supervoter, alive, dead, votingRemind}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {cutoffs} = require(seasonPath + "seasonConfig.json");
const {names, bookPaths} = require(seasonPath + "seasonContestants.json");
const {drawHeader, drawResults} = require(seasonPath + "graphics.js");
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
		const skew = mean(ratings, rating => (rating - average) ** 3) / stDev ** 3;
		results.push({
			rank: undefined,
			dummy: response.dummy,
			book: bookPaths[response.author],
			id: response.author,
			name: names[response.author],
			response: response.text,
			twist: response.twist, // Will be undefined if no twist; this is intended
			percentile: Math.round(average * 1e10) / 1e8, // Avoid ranking by rounding error
			stDev: Math.round(stDev * 1e10) / 1e8,
			skew: Math.round(skew * 1e8) / 1e8,
			votes: ratings.length
		});
	}
	// Sort results
	results.sort((a, b) => b.percentile - a.percentile || a.skew - b.skew); // Tiebreaker: Smaller skew is better
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
		let type = "dead";
		for (const [cutoffType, cutoff] of Object.entries(cutoffs)) {
			if (rank <= Math.round(cutoff * responders)) {
				type = cutoffType;
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
async function sendSlide(path, fileName, rankings, comment) {
	await drawResults(path, currentRound, prompt, rankings);
	const slideMessage = {
		files: [{
			attachment: path,
			name: fileName
		}]
	};
	if (comment != null) {
		slideMessage.content = comment;
	}
	await sendMessage(resultsId, slideMessage, true);
}
function findEntry(rankings, token) {
	let index = rankings.findIndex(row => row.rank === parseInt(token));
	if (token.includes(".")) { // Token is unranked
		index += parseInt(token.split(".")[1]);
	}
	if (rankings[index] == null) {
		throw new Error("Invalid token: " + token);
	}
	return index;
}
function selectEntries(rankings, line) {
	const selection = [];
	for (const token of line) {
		if (token.includes("-")) { // Token is a range
			const start = findEntry(rankings, token.split("-")[0]);
			const end = findEntry(rankings, token.split("-")[1]);
			let range = rankings.slice(start, end + 1);
			if (token.at(-1) === "f") { // Filter out DRPs and dummies
				range = range.filter(row => row.type !== "drp" && row.type !== "dummy");
			}
			selection.push(...range);
		} else { // Token is a single row
			selection.push(rankings[findEntry(rankings, token)]);
		}
	}
	return selection;
}
async function results() {
	logMessage("Results started.");
	const rankings = calculateResults();
	await drawHeader(`${roundPath}results/header.png`, currentRound, prompt);
	await drawResults(`${roundPath}results/leaderboard.png`, currentRound, prompt, rankings, true);
	// Send start message
	stdin.removeListener("data", listeners.consoleListener);
	listeners.processing = true;
	await new Promise(resolve => {
		const startListener = function (input) {
			if (input.toString().trim() === "start") {
				stdin.removeListener("data", startListener);
				resolve();
			}
		};
		stdin.on("data", startListener);
	});
	const resultsMessage = await sendMessage(resultsId, {
		content: `@everyone ${currentRound} Results`,
		files: [{
			attachment: `${roundPath}results/header.png`,
			name: "header.png"
		}]
	}, true);
	client.user.setActivity(`Results for ${currentRound}`, {type: ActivityType.Streaming, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"});
	// Reveal results
	let slide = 1;
	let moreSlides = true;
	while (moreSlides) {
		moreSlides = await new Promise(resolve => stdin.once("data", async input => {
			const line = input.toString().trim();
			if (line === "end") {
				resolve(false);
				return;
			}
			try { // Only send slide and increment if input is valid
				const [selection, comment] = line.split("; ");
				const entries = selectEntries(rankings, selection.split(" "));
				await sendSlide(`${roundPath}results/slide${slide}.png`, `slide${slide}.png`, entries, comment);
				slide++;
			} catch (e) {
				logMessage(`[E] ${e}`, "error");
			}
			resolve(true);
		}));
	}
	stdin.addListener("data", listeners.consoleListener);
	// Full leaderboard
	await sendMessage(resultsId, {
		files: [{
			attachment: `${roundPath}results/leaderboard.png`,
			name: "leaderboard.png"
		}]
	}, true);
	if (leaderboards != null) {
		await sendMessage(leaderboards, {
			content: `${currentVotingRound}: ${resultsMessage.url}`,
			files: [{
				attachment: `${votingRoundPath}results/leaderboard.png`,
				name: "leaderboard.png"
			}]
		}, true);
	}
	// Spoiler wall
	for (let _ = 0; _ < 49; _++) {
		await sendMessage(resultsId, morshu(1), true);
	}
	// Link to beginning of results
	await sendMessage(resultsId, resultsMessage.url, true);
	client.user.setActivity();
	listeners.processing = false;
	listeners.processQueue();
	// Reset contestants.json
	contestants.prize = [];
	contestants.alive = [];
	contestants.dead = [];
	// Remove voting phase roles
	const twow = await client.guilds.fetch(serverId);
	(await twow.roles.fetch(supervoter)).members.forEach(member => member.roles.remove(supervoter));
	(await twow.roles.fetch(votingRemind)).members.forEach(member => member.roles.remove(votingRemind));
	// Update living state and roles
	for (const row of rankings.filter(row => row.type !== "drp" && row.type !== "dummy")) {
		const author = await twow.members.fetch(row.id);
		if (row.type === "dead") {
			author.roles.remove([prize, alive]);
			author.roles.add(dead);
		} else if (row.type === "prize") {
			author.roles.add(prize);
		} else { // "alive" or "danger"
			author.roles.remove(prize);
		}
		contestants[row.type !== "danger" ? row.type : "alive"].push(author.id);
	}
	save(roundPath + "contestants.json", contestants);
	reload();
};
Object.assign(exports, {sendSlide, selectEntries, results});