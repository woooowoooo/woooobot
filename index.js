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
	logMessage(`[R] Console input: ${colors.console}${data.toString().trim()}`, "input", true);
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
			content: text,
			createdAt: new Date(),
			fromConsole: true, // Custom property
			toString: () => text
		});
	}
}
stdin.on("data", consoleLogger);
stdin.on("data", consoleListener);
const listeners = {
	consoleListener,
	consoleLogger,
	processing: false
};
exports.listeners = listeners; // Exported so results.js can use it
// Modules
const readline = require("readline");
const {
	colors, logMessage, getPaths, save, reload,
	sendMessage, toTimeString, toSnowflake, suffixPlural
} = require("./helpers.js");
const morshu = require("./morshu.js");
let {runCommand} = require("./commands.js");
// Configs
const config = require("./config.json");
const {automatic, prefix, token, devId, botId, twowPath, lastUnread} = config; // TODO: Allow for multiple TWOWs
const {serverless, id: serverId, roles, channels: {bots} = {}} = require(twowPath + "twowConfig.json");
let {seasonPath, roundPath, phase} = require(twowPath + "status.json");
const {autoDeadlines} = require(seasonPath + "seasonConfig.json");
let {rDeadline, vDeadline} = require(roundPath + "roundConfig.json");
// Possibly season-specific modules
let {respondingPath, votingPath, resultsPath, initsPath} = getPaths(seasonPath);
let {initResponding, logResponse} = require(respondingPath);
let {initVoting, logVote} = require(votingPath);
let {results} = require(resultsPath);
let {initRound} = require(initsPath);
// Other variables
let queue = [];
let me;
// Process messages
function readMessage(message, readTime = false, queued = listeners.processing) {
	let header = `(${message.id}) ${message.author.discriminator === "0" ? message.author.username : `${colors.error}${message.author.tag}${colors.dm}`} (${message.author.id})`;
	if (message.guild != null) {
		header += ` in ${message.guild.name}, #${message.channel.name}`;
	}
	if (readTime) {
		header += ` at ${toTimeString(message.createdAt)}`;
	}
	if (message.attachments.size !== 0) {
		header += ` (${message.attachments.size} attachment${suffixPlural(message.attachments)} not shown)`;
	}
	logMessage(`[R] ${header}${queued ? " (queued)" : `:\n	${colors.message}${message}`}`, "input", true);
}
function parseCommands(text, message) {
	// Reload commands
	if (text === "reload" && message.author.id === devId) {
		reload();
		({runCommand} = require("./commands.js"));
		({respondingPath, votingPath, resultsPath, initsPath} = getPaths(seasonPath));
		({initResponding, logResponse} = require(respondingPath));
		({initVoting, logVote} = require(votingPath));
		({results} = require(resultsPath));
		({initRound} = require(initsPath));
		return;
	}
	// Execute other commands
	runCommand(text, message, roles).then(reply => {
		if (reply != null) {
			if (!message.fromConsole) {
				sendMessage(message.channel, reply);
			} else {
				logMessage(reply, "message");
			}
		}
	}).catch(e => {
		logMessage(`[E] ${e}`, "error");
		if (message.author.id !== devId) { // I have access to the logs
			sendMessage(message.channel, e.message);
		}
	});
}
function processMessage(message = queue.shift()) {
	if (message.content.substring(0, 2) === "//") {
		// Allow for comments
	} else if (message.content.substring(0, prefix.length) === prefix) {
		// Act on bot commands
		parseCommands(message.content.substring(prefix.length), message);
	} else if (message.guild == null && message.author.id !== devId) {
		// Act on non-command direct messages
		const isVote = /\[.*\]/.test(message.content);
		if (phase === "responding" || phase === "both" && !isVote) {
			logResponse(message).then(reply => sendMessage(message.author.dmChannel, reply));
		} else if (phase === "voting" || phase === "both") {
			sendMessage(message.author.dmChannel, logVote(message));
		}
	}
}
async function processMessageAsync(message) {
	process.stdout.write("\u0007"); // Bell
	return new Promise((resolve, reject) => stdin.on("keypress", function fullListener(_, key) {
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
	}));
}
async function processQueue() {
	// Enter message processing mode
	listeners.processing = true;
	if (!automatic) {
		stdin.removeListener("data", consoleListener);
		stdin.removeListener("data", consoleLogger);
		stdin.setRawMode(true);
		readline.emitKeypressEvents(process.stdin);
	}
	// Act on queued messages
	while (queue.length > 0) {
		const message = queue.shift();
		// Read and process message
		readMessage(message, true, false);
		automatic ? processMessage(message) : await processMessageAsync(message);
		// Update last checked time
		config.lastUnread = toSnowflake(message.id);
		await save("./config.json", config);
	}
	// Exit message processing mode
	if (!automatic) {
		stdin.setRawMode(false);
		stdin.on("data", consoleListener);
		stdin.on("data", consoleLogger);
	}
	listeners.processing = false;
}
listeners.processQueue = processQueue;
async function queueDMs() {
	// Get non-bot non-dev members
	const server = await client.guilds.fetch(serverId);
	const botRole = await server.roles.fetch(roles.bot);
	const members = (await server.members.fetch()).filter(m => m.id !== devId && !m.roles.cache.has(botRole.id));
	// Add unread DMs to queue
	listeners.processing = true;
	for (const [_, member] of members) {
		const transitional = member.user.discriminator === "0" ? member.user.username : `${colors.error}${member.user.tag}${colors.dm}`;
		const dms = await member.createDM().catch(() => logMessage(`[E] Failed to create DM to ${transitional}`, "error"));
		if (dms == null) {
			continue;
		}
		logMessage(`DM to ${transitional} created.`, "dm", true);
		const messages = await dms.messages.fetch({after: lastUnread});
		for (const [_, message] of messages.filter(m => m.author.id !== botId)) {
			readMessage(message, true);
			queue.push(message);
		}
	};
	// Sort queue by time
	queue.sort((a, b) => a.createdAt - b.createdAt);
	// Filter out duplicates (from messageCreate handler)
	queue = queue.filter((message, index) => queue.findIndex(m => m.id === message.id) === index);
}
// Event handling
process.on("uncaughtException", e => logMessage(`[E] ${e}\nStack trace is below:\n${e.stack}`, "error"));
client.once("ready", async function () {
	// Send startup messages to console
	const initLog = `Logged in as ${client.user.tag}.\n\n`;
	logMessage("=".repeat(initLog.length - 2));
	logMessage(initLog + morshu.generate(5) + "\n");
	// Initialize me
	me = await client.users.fetch(devId);
	me.createDM(); // To allow for console input to work
	// Read DMs
	if (!serverless) {
		await queueDMs();
		await processQueue();
	}
	// Start new phase
	if (autoDeadlines) {
		if ((phase === "voting" || phase === "both") && toTimeString() > vDeadline) {
			await results();
			await initRound();
			reload();
			({roundPath} = require(twowPath + "status.json"));
			({rDeadline, vDeadline} = require(roundPath + "roundConfig.json"));
			({initResponding, logResponse} = require(respondingPath));
			({initVoting, logVote} = require(votingPath));
			({results} = require(resultsPath));
			({initRound} = require(initsPath));
			await initResponding();
			({phase} = require(twowPath + "status.json"));
		}
		if ((phase === "responding" || phase === "both") && toTimeString() > rDeadline) {
			await initVoting();
		}
	}
});
client.on("messageCreate", async function (message) {
	// Ignore irrelevant messages
	if (message.author.id === botId || message.guild != null && !bots.includes(message.channel.id)) {
		return;
	}
	// Read and queue message
	readMessage(message);
	queue.push(message);
	// Process queue if not already processing
	if (!listeners.processing) {
		await processQueue();
	}
});
client.login(token);