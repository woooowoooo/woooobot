// Discord.js
const {Client, Intents} = require("discord.js");
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGES
	],
	partials: [
		"CHANNEL"
	]
});
exports.client = client; // Client is exported so helpers.js can use it
// Configs
let config = require("./config.json");
const {automatic, prefix, token, devId, botId, twowPath, lastUnread} = config; // TODO: Allow for multiple TWOWs
const {id: serverId, roles, channels: {bots}} = require(twowPath + "twowConfig.json");
let {seasonPath, roundPath, phase} = require(twowPath + "status.json");
let {
	autoDeadlines,
	respondingPath = "./responding.js",
	votingPath = "./voting.js",
	resultsPath = "./results.js"
} = require(seasonPath + "seasonConfig.json");
let {rDeadline, vDeadline} = require(roundPath + "roundConfig.json");
// Modules
const readline = require("readline");
const {getTime, logMessage, sendMessage, toSnowflake, save, reload} = require("./helpers.js");
const morshu = require("./morshu.js");
let {initRound} = require("./inits.js");
let {initResponding, logResponse} = require(respondingPath);
let {initVoting, logVote} = require(votingPath);
let {results} = require(resultsPath);
let commands = require("./commands.js");
// Other variables
const stdin = process.openStdin();
const queue = [];
let me;
// Process messages
function readMessage(message, readTime = false, queued = queue.length > 0) {
	let header = message.author.tag;
	if (message.guild != null) {
		header += ` in ${message.guild.name}, #${message.channel.name}`;
	}
	if (readTime) {
		header += ` at ${getTime(message.createdAt)}`;
	}
	logMessage(`[R] ${header}${queued ? " (queued)" : `:\n	${message}`}`);
}
function parseCommands(text, message) {
	const command = text.split(" ", 1)[0];
	// Default parameters only act on "undefined" and not an empty string.
	const args = text.substring(command.length + 1) || undefined;
	// Reload commands
	if (command === "reload" && message.author.id === devId) {
		commands = reload("./commands.js");
		// TODO: Add a way to reload other modules
		return;
	}
	// Execute other commands
	commands(command, args, message, roles).then(reply => {
		if (reply != null) {
			sendMessage(message.channel, reply);
		}
	}).catch(e => {
		logMessage(`[E] ${e}`, true);
		if (message.author.id !== devId) { // I have access to the logs
			sendMessage(message.channel, e.message);
		}
	});
}
function processMessage(message = queue.shift()) {
	if (message.content.substring(0, prefix.length) === prefix) {
		// Act on bot commands
		parseCommands(message.content.substring(prefix.length), message);
	} else if (message.guild == null && message.author.id !== devId) {
		// Act on non-command direct messages
		if (phase === "responding") {
			sendMessage(message.author.dmChannel, logResponse(message));
		} else if (phase === "voting") {
			sendMessage(message.author.dmChannel, logVote(message));
		}
	}
}
async function processMessageAsync(message) {
	// Process message if I press "r"; skip on other keys
	return new Promise(resolve => stdin.once("keypress", function (_, key) {
		if (key.name === "r") {
			logMessage("Message read");
			processMessage(message);
		} else {
			logMessage("Message skipped");
		}
		resolve();
	}));
}
// Event handling
process.on("uncaughtException", e => logMessage(`[E] ${e}\nStack trace is below:\n${e.stack}`, true));
client.once("ready", async function () {
	// Send startup messages to console
	const initLog = `Logged in as ${client.user.tag}.\n\n`;
	logMessage("=".repeat(initLog.length - 2));
	logMessage(initLog + morshu.generate(5) + "\n");
	// Initialize me
	me = await client.users.fetch(devId);
	me.createDM(); // To allow for console input to work
	// Get non-bot non-dev members
	const server = await client.guilds.fetch(serverId);
	const botRole = await server.roles.fetch(roles.bot);
	const members = (await server.members.fetch()).filter(m => m.id !== devId && !m.roles.cache.has(botRole.id));
	// Queue unread DMs
	for (const [_, member] of members) {
		const dms = await member.createDM().catch(() => logMessage(`[E] Failed to create DM to ${member.user.tag}`, true));
		if (dms == null) {
			continue;
		}
		logMessage(`DM to ${member.user.tag} created.`);
		const messages = await dms.messages.fetch();
		for (const [_, message] of messages.filter((m, s) => m.author.id !== botId && BigInt(s) > BigInt(lastUnread))) {
			readMessage(message, true, true);
			queue.push(message);
		}
	};
	// Act on unread messages
	if (!automatic) {
		stdin.removeListener("data", consoleListener);
		stdin.removeListener("data", consoleLogger);
		stdin.setRawMode(true);
		readline.emitKeypressEvents(process.stdin);
	}
	while (queue.length > 0) {
		const message = queue.shift();
		readMessage(message, true, false);
		automatic ? processMessage(message) : await processMessageAsync(message);
	}
	if (!automatic) {
		stdin.setRawMode(false);
		stdin.on("data", consoleListener);
		stdin.on("data", consoleLogger);
	}
	// Update last checked time
	config.lastUnread = toSnowflake();
	await save("./config.json", config);
	// Start new phase
	if (autoDeadlines) {
		if (phase === "responding" && getTime() > rDeadline) {
			await initVoting();
		} else if (phase === "voting" && getTime() > vDeadline) {
			await results();
			await initRound();
			({roundPath} = reload(twowPath + "status.json"));
			({rDeadline, vDeadline} = reload(roundPath + "roundConfig.json"));
			({initRound} = reload("./inits.js"));
			({initResponding, logResponse} = reload(respondingPath));
			({initVoting, logVote} = reload(votingPath));
			({results} = reload(resultsPath));
			await initResponding();
			({phase} = reload(twowPath + "status.json"));
		}
	}
});
client.on("messageCreate", async function (message) {
	config.lastUnread = toSnowflake();
	await save("./config.json", config);
	if (message.author.id === botId || message.guild != null && !bots.includes(message.channel.id)) { // Ignore irrelevant messages
		return;
	}
	readMessage(message);
	if (queue.push(message) > 1) {
		// TODO: Fix queue
		return;
	}
	if (automatic) {
		processMessage();
	} else {
		stdin.removeListener("data", consoleListener);
		stdin.removeListener("data", consoleLogger);
		stdin.setRawMode(true);
		await processMessageAsync();
		stdin.setRawMode(false);
		stdin.on("data", consoleListener);
		stdin.on("data", consoleLogger);
	}
});
client.login(token);
// Respond to console input
function consoleLogger(data) {
	logMessage(`[R] Console input: ${data.toString().trim()}`);
}
function consoleListener(data) {
	let text = data.toString().trim();
	if (text.substring(0, 2) !== "//") { // Allow for dev comments
		if (text.substring(0, prefix.length) === prefix) {
			text = text.substring(prefix.length);
		}
		parseCommands(text, {
			author: me,
			channel: me.dmChannel
		});
	}
}
stdin.on("data", consoleLogger);
stdin.on("data", consoleListener);