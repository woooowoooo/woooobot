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
if (logging) {
	logStream = fs.createWriteStream(`./logs/${getTime().replace(/\s/g, "-")}.log`, {
		"flags": "ax"
	});
}
// Helper functions
function logMessage(message, error = false) {
	let time = getTime();
	if (error) {
		console.error(`${time} [E] ${message}`);
	} else {
		console.log(`${time} ${message}`);
	}
	if (logging) {
		logStream.write(`${time} ${message}\n`);
	}
}
function sendMessage(destination, message) {
	if (message.length > 2000) {
		logMessage("Message is too long!", true);
		return;
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
	console.log(`[E] ${e}`);
	// logMessage(e, true);
});
client.once("ready", async function () {
	let initLog = `Logged in as ${client.user.tag}.\n`;
	logMessage('='.repeat(initLog.length - 1));
	logMessage(initLog);
	me = await client.users.fetch(devID);
});
client.on("message", function (message) {
	const isDM = message.guild == null && message.author.id !== botID;
	const server = message.guild;
	const {roles, channels: {botChannels}} = require(`${twows["Sample TWOW"]}/twowConfig.json`);
	// Act on bot DMs
	if (isDM) {
		const log = `${message.author.tag}:\n	${message}`;
		logMessage(`[R] ${log}`);
		if (message.author.id !== devID) { // I know what I sent
			sendMessage(me.dmChannel, log);
		}
		recordResponse(message.author, message);
	}
	// Act on messages with the bot prefix
		let content = message.content.substring(prefix.length);
		let command = content.split(" ", 1)[0];
		let args = content.substring(command.length + 1); // Keep the separating space out as well
			if (reply) {
	if (message.content.substring(0, prefix.length) === prefix && (isDM || botChannels.includes(message.channel.id))) {
		commands(server, roles, message.author, command, args).then(reply => {
				sendMessage(message.channel, reply);
			}
		}).catch(e => {
			logMessage(e, true);
			if (message.author.id !== devID) { // I have access to the logs
				sendMessage(message.channel, `Error: ${e}`);
			}
		});
	}
});
client.login(token);