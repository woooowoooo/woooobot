// Modules
const Discord = require("discord.js");
const recordResponse = require("./responding.js");
const {prefix, token, devID, botID, twows} = require("./config.json");
const {logMessage} = require("./helpers.js");
let commands = require("./commands.js");
// Other variables
const client = new Discord.Client();
let me;
// Helper functions
function sendMessage(destination, message) {
	if (message.length > 2000) {
		throw new Error("Message is too long!");
	}
	destination.send(message);
	if (destination.type === "dm") {
		logMessage(`[S] ${destination.recipient.tag}:\n	${message}`);
	} else { // If it's not a DM it's probably a text channel.
		logMessage(`[S] ${destination.guild.name}, ${destination.name}:\n	${message}`);
	}
}
client.sendMessage = sendMessage;
function parseCommands(message, author, server, channel, roles) {
	const content = message.substring(prefix.length);
	const command = content.split(" ", 1)[0];
	// Default parameters only act on "undefined" and not an empty string.
	const args = content.substring(command.length + 1) || undefined;
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
	logMessage(`[E] ${e}`, true);
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
	const server = message.guild;
	const {roles, channels: {botChannels}} = require(`${twows["Sample TWOW"]}/twowConfig.json`);
	if (author.id === botID || server != null && !botChannels.includes(message.channel.id)) {
		return;
	}
	// Act on direct messages
	if (server == null) {
		logMessage(`[R] ${author.tag}:\n	${message}`);
		if (author.id !== devID) { // I know what I sent
			sendMessage(me.dmChannel, `${author.tag}:\n${message}`);
		}
		recordResponse(author, message);
	}
	// Act on messages with the bot prefix
	if (message.content.substring(0, prefix.length) === prefix) {
		if (server != null) { // DMs already get logged
			logMessage(`[R] ${author.tag} in ${server.name}, ${message.channel.name}:\n	${message}`);
		}
		parseCommands(message.content, author, server, message.channel, roles);
	}
});
client.login(token);
// Respond to console input
let stdin = process.openStdin();
stdin.addListener("data", function (message) {
	message = message.toString().trim();
	logMessage(`[R] console input: ${message}`);
	parseCommands(message, me, null, me.dmChannel, require(`${twows["Sample TWOW"]}/twowConfig.json`).roles);
});