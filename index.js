// Discord.js
const {Client, GatewayIntentBits, Partials} = require("discord.js");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [
		Partials.Channel
	]
});
exports.client = client; // Client is exported so helpers.js can use it
// Console event handling (up here for exports)
const stdin = process.openStdin();
function consoleLogger(data) {
	logMessage(`[R] Console input: ${data.toString().trim()}`);
}
function consoleListener(data) {
	let text = data.toString().trim();
	if (text.substring(0, 2) !== "//") { // Allow for comments
		if (text.substring(0, prefix.length) === prefix) {
			text = text.substring(prefix.length);
		}
		parseCommands(text, { // Flesh this out
			author: me,
			channel: me.dmChannel,
			createdAt: new Date()
		});
	}
}
stdin.on("data", consoleLogger);
stdin.on("data", consoleListener);
exports.consoleListener = consoleListener; // Exported so results.js can use it
exports.consoleLogger = consoleLogger;
// Configs
let config = require("./config.json");
const {automatic, prefix, token, devId, botId, twowPath, lastUnread} = config; // TODO: Allow for multiple TWOWs
const {id: serverId, roles, channels: {bots}} = require(twowPath + "twowConfig.json");
let {seasonPath, roundPath, phase} = require(twowPath + "status.json");
let {autoDeadlines} = require(seasonPath + "seasonConfig.json");
let {rDeadline, vDeadline} = require(roundPath + "roundConfig.json");
// Modules
const readline = require("readline");
const {toTimeString, logMessage, sendMessage, toSnowflake, getPaths, save, reload} = require("./helpers.js");
const morshu = require("./morshu.js");
let commands = require("./commands.js");
// Possibly season-specific modules
let {respondingPath, votingPath, resultsPath, initsPath} = getPaths(seasonPath);
let {initResponding, logResponse} = require(respondingPath);
let {initVoting, logVote} = require(votingPath);
let {results} = require(resultsPath);
let {initRound} = require(initsPath);
// Other variables
const queue = [];
let processing = false;
let me;
// Process messages
function readMessage(message, readTime = false, queued = queue.length > 0) {
	let header = `(${message.id}) ${message.author.tag} (${message.author.id})`;
	if (message.guild != null) {
		header += ` in ${message.guild.name}, #${message.channel.name}`;
	}
	if (readTime) {
		header += ` at ${toTimeString(message.createdAt)}`;
	}
	logMessage(`[R] ${header}${queued ? " (queued)" : `:\n	${message}`}`);
}
function parseCommands(text, message) {
	const command = text.split(" ", 1)[0];
	const argText = text.substring(command.length + 1);
	// Reload commands
	if (command === "reload" && message.author.id === devId) {
		commands = reload("./commands.js");
		// TODO: Add a way to reload other modules
		return;
	}
	// Execute other commands
	commands(command, argText, message, roles).then(reply => {
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
		let isVote = /\[.*\]/.test(message.content);
		if (phase === "responding" || phase === "both" && !isVote) {
			logResponse(message).then(reply => sendMessage(message.author.dmChannel, reply));
		} else if (phase === "voting" || phase === "both") {
			sendMessage(message.author.dmChannel, logVote(message));
		}
	}
}
async function processMessageAsync(message) {
	process.stdout.write("\u0007"); // Bell
	return new Promise((resolve, reject) => {
		const fullListener = (_, key) => {
			if (key.ctrl && key.name === "r") {
				// Ctrl + R: Process message
				logMessage("Message read");
				try {
					processMessage(message);
					stdin.removeListener("keypress", fullListener);
					resolve();
				} catch (e) {
					reject(e);
				}
			} else if (key.ctrl && key.name === "s") {
				// Ctrl + S: Skip message
				logMessage("Message skipped");
				stdin.removeListener("keypress", fullListener);
				resolve();
			} else if (key.ctrl && key.name === "c") {
				// Ctrl + C: Exit
				logMessage("Ending woooobot…");
				process.exit();
			}
		};
		stdin.on("keypress", fullListener);
	});
}
async function processQueue() {
	// Act on unread messages
	processing = true;
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
		// Update last checked time
		config.lastUnread = toSnowflake(message.id);
		await save("./config.json", config);
	}
	if (!automatic) {
		stdin.setRawMode(false);
		stdin.on("data", consoleListener);
		stdin.on("data", consoleLogger);
	}
	processing = false;
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
	// Queue and process unread DMs
	processing = true;
	for (const [_, member] of members) {
		const dms = await member.createDM().catch(() => logMessage(`[E] Failed to create DM to ${member.user.tag}`, true));
		if (dms == null) {
			continue;
		}
		logMessage(`DM to ${member.user.tag} created.`);
		const messages = await dms.messages.fetch({after: lastUnread});
		for (const [_, message] of messages.filter(m => m.author.id !== botId)) {
			readMessage(message, true, true);
			queue.push(message);
		}
	};
	queue.sort((a, b) => a.createdAt - b.createdAt); // Sort queue by time
	await processQueue();
	// Start new phase
	if (autoDeadlines) {
		if ((phase === "voting" || phase === "both") && toTimeString() > vDeadline) {
			await results();
			await initRound();
			({roundPath} = reload(twowPath + "status.json"));
			({rDeadline, vDeadline} = reload(roundPath + "roundConfig.json"));
			({initResponding, logResponse} = reload(respondingPath));
			({initVoting, logVote} = reload(votingPath));
			({results} = reload(resultsPath));
			({initRound} = reload(initsPath));
			await initResponding();
			({phase} = reload(twowPath + "status.json"));
		}
		if ((phase === "responding" || phase === "both") && toTimeString() > rDeadline) {
			await initVoting();
		}
	}
});
client.on("messageCreate", async function (message) {
	if (message.author.id === botId || message.guild != null && !bots.includes(message.channel.id)) { // Ignore irrelevant messages
		return;
	}
	readMessage(message);
	queue.push(message);
	if (!processing) {
		await processQueue();
	}
});
client.login(token);