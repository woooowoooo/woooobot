// Discord
const Discord = require("discord.js");
const client = new Discord.Client(); // Client is down here so helpers.js can use it
exports.client = client;
// Config modules
const {prefix, token, devID, botID, twows} = require("./config.json");
const {id: serverID, roles, channels: {bots}} = require(`${twows["Sample TWOW"]}/twowConfig.json`);
// Function modules
const {logMessage, sendMessage} = require("./helpers.js");
const morshu = require("./morshu.js");
const {logResponse} = require("./responding.js");
const {logVote} = require("./voting.js");
let commands = require("./commands.js");
// Other variables
let me;
// Command parsing function
function parseCommands(message, author, channel) {
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
	commands(command, args, author, message.server, roles).then(reply => {
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
	// Send startup messages to console
	const initLog = `Logged in as ${client.user.tag}.\n\n`;
	logMessage('='.repeat(initLog.length - 2));
	logMessage(initLog + morshu.generate(10) + '\n');
	// Initialize me
	me = await client.users.fetch(devID);
	me.createDM(); // To allow for console input to work
	// TODO: Create DMs for every participant
});
client.on("message", function (message) {
	const author = message.author;
	const channel = message.channel;
	const {phase} = require(`${twows["Sample TWOW"]}/status.json`);
	if (author.id === botID || message.guild != null && !bots.includes(channel.id)) {
		return;
	}
	logMessage(`[R] ${author.tag + (message.guild != null) && ` in ${message.guild.name}, ${channel.name}`}:\n	${message}`);
	if (message.content.substring(0, prefix.length) === prefix) {
		// Act on commands
		parseCommands(message.content.substring(prefix.length), author, channel);
	} else if (message.guild == null && author.id !== devID) {
		// Act on non-command direct messages
		sendMessage(me.dmChannel, `${author.tag}:\n${message}`);
		if (phase === "responding") {
			logResponse(message, author);
		} else if (phase === "voting") {
			logVote(message, author);
		}
	}
});
client.login(token);
// Respond to console input
let stdin = process.openStdin();
stdin.addListener("data", function (message) {
	message = message.toString().trim();
	logMessage(`[R] Console input: ${message}`);
	if (message.substring(0, 2) !== "//") {
		parseCommands(message, me, me.dmChannel);
	}
});