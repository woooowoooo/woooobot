// Modules
const {logMessage, sendMessage, getTime, toUnixTime, save} = require("./helpers.js");
const {generate: morshu} = require("./morshu.js");
// Data
const {twowPath} = require("./config.json"); // TODO: Add support for multiple TWOWs
let status = require(twowPath + "status.json");
const {currentRound, seasonPath, roundPath} = status;
const {
	roles: {alive, remind},
	channels: {bots, voting, reminders: remindersId, results: resultsId}
} = require(twowPath + "twowConfig.json");
// Season-specific
const {reminders, sections: _s, megascreen: _m} = require(seasonPath + "seasonConfig.json");
const {drawScreen, drawResults} = require(seasonPath + "graphics.js");
// Round-specific
// TODO: Find a better way to do destructuring assignment with a collective default value
const {prompt, vDeadline, keywords, sections = _s, megascreen = _m} = require(roundPath + "roundConfig.json");
let responses = require(roundPath + "responses.json");
let votes = require(roundPath + "votes.json");
const screens = require(roundPath + "screens.json");
const {screenSections, screenResponses} = screens;
// Functions
function partitionResponses(responseAmount) {
	const MIN = 7;
	const MAX = (2 * MIN - 1);
	const IDEAL = Math.floor((MAX + MIN) / 2);
	// Trivial cases
	if (responseAmount <= MAX) {
		return [responseAmount];
	}
	if (responseAmount >= IDEAL * (IDEAL - 1)) { // Special case of the Chicken McNugget theorem
		let screenSizes = Array(Math.floor(responseAmount / IDEAL));
		return screenSizes.fill(IDEAL).fill(IDEAL + 1, 0, responseAmount % IDEAL);
	}
	// TODO: General case
	let screenSizes = [];
	let i = 0;
	while (responseAmount > IDEAL) {
		screenSizes[i] = IDEAL;
		responseAmount -= IDEAL;
		i++;
	}
	screenSizes[i] = responseAmount;
	return screenSizes;
}
function createScreen(responses, keyword, section) {
	let rows = new Map();
	let ids = new Map();
	// Create text screen
	let screen = `\`\`\`\n${keyword}\n`;
	// TODO: Extend characters
	let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let charIndex = 0;
	for (const response of responses) {
		let char = chars[charIndex];
		screen += `${char}\t${response.twist ?? response.text}\n`;
		rows.set(char, response.twist ?? response.text);
		ids.set(char, response.id);
		charIndex++;
	}
	screen += "```";
	logMessage(screen);
	screenSections[keyword] = section;
	screenResponses[keyword] = Object.fromEntries(ids.entries());
	// Draw screen
	const path = `${roundPath}/screens/${keyword}.png`;
	drawScreen(path, keyword, Array.from(rows.entries())).then(() => {
		sendMessage(voting, {
			content: screen, // For easy voter.js input
			files: [{
				attachment: path,
				name: keyword + ".png"
			}]
		}, true);
	});
}
function createSection(responses, sizes, sectWord) {
	for (let i = 0; i < responses.length; i++) { // Randomize response array
		let j = Math.floor(Math.random() * i);
		[responses[i], responses[j]] = [responses[j], responses[i]];
	}
	for (let i = 0; i < sizes.length; i++) {
		createScreen(responses.splice(0, sizes[i]), `${sectWord}-${i + 1}`, sectWord);
	}
}
exports.initVoting = function () {
	logMessage("Voting period started.");
	status.phase = "voting";
	save(`${twowPath}/status.json`, status);
	const unixDeadline = toUnixTime(vDeadline);
	sendMessage(voting, `<@&${alive}> ${currentRound}\nVote to <@814748906046226442> by <t:${unixDeadline}> (<t:${unixDeadline}:R>)`, true);
	// Create voting
	logMessage(prompt);
	const screenSizes = partitionResponses(responses.length);
	for (let i = 0; i < sections; i++) {
		createSection([...responses], screenSizes, (i + 1).toString());
	}
	if (megascreen) {
		createScreen(responses, "MEGA", "MEGA");
	}
	save(roundPath + "screens.json", screens);
};
exports.logVote = function (message) {
	logMessage(`Recording vote by ${message.author}:\n${message}`);
	const voteFull = message.content.matchAll(/\[([^\s[\]]+) ([^\s[\]]+)\]/g);
	votes[message.author.id] = {
		"id": message.id,
		"time": getTime(message.createdAt),
		"text": message.content,
		"section": section,
		// "supervote": "TODO",
		"screens": voteFull
		// TODO: Add more stats
	};
};
exports.results = function () {
	// TODO: Create results
	// Spoiler wall
	for (let i = 0; i < 50; i++) {
		sendMessage(results, morshu(1), true);
	}
};