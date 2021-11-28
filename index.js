// Modules
const Discord = require("discord.js");
const client = new Discord.Client(); // Client is down here so helpers.js can use it
exports.client = client;
const {prefix, token, devID, botID, twows} = require("./config.json");
const {logMessage, sendMessage} = require("./helpers.js");
const {logResponse} = require("./responding.js");
const {logVote} = require("./voting.js");
let commands = require("./commands.js");
// Other variables
let me;
// Command parsing function
function parseCommands(message, author, server, channel, roles) {
	const command = message.split(" ", 1)[0];
	// Default parameters only act on "undefined" and not an empty string.
	const args = message.substring(command.length + 1) || undefined;
	// Reload commands
	if (command === "reload" && author.id === devID) {
		delete require.cache[require.resolve("./commands.js")];
		commands = require("./commands.js");
		logMessage("Commands reloaded.");
		return;
	}
	// Execute other commands
	commands(command, args, author, server, roles).then(reply => {
		if (reply != null) {
			sendMessage(channel, reply);
		}
	}).catch(e => {
		logMessage(`[E] ${e}`, true);
		if (author.id !== devID) { // I have access to the logs
			sendMessage(channel, e);
		}
	});
}
// Event handling
process.on("uncaughtException", e => {
	logMessage(`[E] ${e}\nStack trace is below:\n${e.stack}`, true);
});
client.once("ready", async function () {
	const initLog = `Logged in as ${client.user.tag}.\n`;
	logMessage('='.repeat(initLog.length - 1));
	logMessage(initLog);
	me = await client.users.fetch(devID);
	me.createDM(); // To allow for console input to work
});
client.on("message", function (message) {
	const author = message.author;
	const channel = message.channel;
	const server = message.guild;
	const {roles, channels: {bots}} = require(`${twows["Sample TWOW"]}/twowConfig.json`);
	const {phase} = require(`${twows["Sample TWOW"]}/status.json`);
	if (author.id === botID || server != null && !bots.includes(channel.id)) {
		return;
	}
	// Act on direct messages
	if (server == null) {
		logMessage(`[R] ${author.tag}:\n	${message}`);
		if (author.id !== devID) { // I know what I sent
			sendMessage(me.dmChannel, `${author.tag}:\n${message}`);
		}
		if (phase === "responding") {
			logResponse(message, author);
		} else if (phase === "voting") {
			logVote(message, author);
		}
	}
	// Act on messages with the bot prefix
	if (message.content.substring(0, prefix.length) === prefix) {
		if (server != null) { // DMs already get logged
			logMessage(`[R] ${author.tag} in ${server.name}, ${channel.name}:\n	${message}`);
		}
		parseCommands(message.content.substring(prefix.length), author, server, channel, roles);
	}
});
client.login(token);
// Respond to console input
let stdin = process.openStdin();
stdin.addListener("data", function (message) {
	message = message.toString().trim();
	logMessage(`[R] Console input: ${message}`);
	if (message.substring(0, 2) !== "//") {
		parseCommands(message, me, null, me.dmChannel, require(`${twows["Sample TWOW"]}/twowConfig.json`).roles);
	}
});