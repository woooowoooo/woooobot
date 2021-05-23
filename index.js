// Modules
const Discord = require("discord.js");
const fs = require("fs");
const {logging, prefix, token, devID, botID, twows} = require("./config.json");
const commands = require("./commands.js");
const {getTime} = require("./helpers.js");
const recordResponse = require("./responding.js");
// Other variables
const client = new Discord.Client();
let me;
let logStream;
if (logging != null) {
	const time = new Date();
	const path = `${logging}/${time.toISOString().substring(0, 7)}`;
	fs.promises.mkdir(path, {recursive: true}).then(() => {
		logStream = fs.createWriteStream(`${path}/${getTime(time).replace(/\s/g, "-")}.log`, {flags: "ax"});
	});
}
// Helper functions
function logMessage(message, error = false) {
	const time = getTime();
	if (error) {
		console.error(`${time} ${message}`);
	} else {
		console.log(`${time} ${message}`);
	}
	if (logging != null) {
		logStream.write(`${time} ${message}\n`);
	}
}
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
// Event handling
process.on("uncaughtException", e => {
	logMessage(`[E] ${e}`, true);
});
client.once("ready", async function () {
	const initLog = `Logged in as ${client.user.tag}.\n`;
	logMessage('='.repeat(initLog.length - 1));
	logMessage(initLog);
	me = await client.users.fetch(devID);
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
		if (server != null) {
			logMessage(`[R] ${author.tag} in ${server.name}, ${message.channel.name}:\n	${message}`);
		}
		const content = message.content.substring(prefix.length);
		const command = content.split(" ", 1)[0];
		const args = content.substring(command.length + 1); // Keep the separating space out as well
		commands(server, roles, author, command, args).then(reply => {
			if (reply != null) {
				sendMessage(message.channel, reply);
			}
		}).catch(e => {
			logMessage(`[E] ${e}`, true);
			if (author.id !== devID) { // I have access to the logs
				sendMessage(message.channel, e);
			}
		});
	}
});
client.login(token);