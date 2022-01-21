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
const {roundPath, phase} = require(twowPath + "status.json");
const {rDeadline, vDeadline} = require(roundPath + "roundConfig.json");
// Modules
const readline = require("readline");
const {getTime, logMessage, sendMessage, toSnowflake, save} = require("./helpers.js");
const morshu = require("./morshu.js");
const {initResponding, initRound, logResponse} = require("./responding.js");
const {initVoting, logVote} = require("./voting.js");
const {results} = require("./results.js");
let commands = require("./commands.js");
// Other variables
const stdin = process.openStdin();
let me;
// Process messages
function readMessage(message, readTime = false) {
	// Ignore own messages and non-bot channels
	if (message.author.id === botId || message.guild != null && !bots.includes(message.channel.id)) {
		return false;
	}
	let header = message.author.tag;
	if (message.guild != null) {
		header += ` in ${message.guild.name}, #${message.channel.name}`;
	}
	if (readTime) {
		header += ` at ${getTime(message.createdAt)}`;
	}
	logMessage(`[R] ${header}:\n	${message}`);
	return true;
}
function parseCommands(text, message) {
	const command = text.split(" ", 1)[0];
	// Default parameters only act on "undefined" and not an empty string.
	const args = text.substring(command.length + 1) || undefined;
	// Reload commands
	if (command === "reload" && message.author.id === devId) {
		delete require.cache[require.resolve("./commands.js")];
		commands = require("./commands.js");
		logMessage("Commands reloaded.");
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
			sendMessage(message.channel, e);
		}
	});
}
function processMessage(message) {
	if (message.content.substring(0, prefix.length) === prefix) {
		// Act on bot commands
		parseCommands(message.content.substring(prefix.length), message);
	} else if (message.guild == null && message.author.id !== devId) {
		// Act on non-command direct messages
		if (phase === "responding") {
			sendMessage(message.author.dmChannel, logResponse(message, message.author));
		} else if (phase === "voting") {
			sendMessage(message.author.dmChannel, logVote(message, message.author));
		}
	}
}
async function processMessageAsync(message) {
	// Process message if I press "r"; skip on other keys
	return new Promise(resolve => {
		stdin.once("keypress", function (_, key) {
			if (key.name === "r") {
				processMessage(message);
			}
			resolve();
		});
	});
}
// Event handling
process.on("uncaughtException", e => {
	logMessage(`[E] ${e}\nStack trace is below:\n${e.stack}`, true);
});
client.once("ready", async function () {
	// Send startup messages to console
	const initLog = `Logged in as ${client.user.tag}.\n\n`;
	logMessage("=".repeat(initLog.length - 2));
	logMessage(initLog + morshu.generate(5) + "\n");
	me = await client.users.fetch(devId); // Initialize me
	me.createDM(); // To allow for console input to work
	// Get non-bot non-dev members
	const server = await client.guilds.fetch(serverId);
	const botRole = await server.roles.fetch(roles.bot);
	const members = (await server.members.fetch()).filter(m => m.id !== devId && !m.roles.cache.has(botRole.id));
	// Act on recent DMs
	readline.emitKeypressEvents(process.stdin);
	stdin.removeListener("data", consoleListener);
	stdin.setRawMode(true);
	for (const [_, member] of members) {
		const dms = await member.createDM().catch(() => logMessage(`[E] Failed to create DM to ${member.user.tag}`, true));
		if (dms == null) {
			continue;
		}
		logMessage(`DM to ${member.user.tag} created.`);
		const messages = await dms.messages.fetch();
		for (const [_, message] of messages.filter((m, s) => m.author.id !== botId && BigInt(s) > BigInt(lastUnread))) {
			if (readMessage(message, true)) {
				automatic ? processMessage(message) : await processMessageAsync(message);
			}
		}
	};
	stdin.setRawMode(false);
	stdin.on("data", consoleListener);
	// Update last checked time
	config.lastUnread = toSnowflake();
	await save("./config.json", config);
	// Start new phase
	if (phase === "responding" && getTime() > rDeadline) {
		initVoting();
	} else if (phase === "voting" && getTime() > vDeadline) {
		results();
		// initRound();
		// initResponding();
	}
});
client.on("messageCreate", async function (message) {
	config.lastUnread = toSnowflake();
	await save("./config.json", config);
	if (!readMessage(message)) { // Ignore irrelevant messages
		return;
	}
	if (automatic) {
		processMessage(message);
	} else {
		stdin.removeListener("data", consoleListener);
		stdin.setRawMode(true);
		await processMessageAsync(message);
		stdin.setRawMode(false);
		stdin.on("data", consoleListener);
	}
});
client.login(token);
// Respond to console input
function consoleListener(text) {
	text = text.toString().trim();
	logMessage(`[R] Console input: ${text}`);
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
stdin.on("data", consoleListener);