// Modules
const Discord = require("discord.js");
const fs = require("fs");
const {
	logging,
	prefix,
	codes: {token},
	ids: {devID, botID, serverID}
} = require("./config.json");
const {execute} = require("./commands.js");
// Other variables
const client = new Discord.Client();
let logStream;
if (logging) {
	logStream = fs.createWriteStream(`./logs/${getTime(true)}.log`, {
		"flags": "ax"
	});
}
let server;
let me;
// Helper functions
function getTime(oneWord = false) {
	let date = new Date();
	return date.toISOString().substring(0, 10) + (oneWord ? '-' : ' ') + date.toISOString().substring(11, 19);
}
exports.getTime = getTime;
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
exports.logMessage = logMessage;
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
exports.sendMessage = sendMessage;
function logDM(message) {
	const log = `${message.author.tag}:\n	${message}`;
	if (message.author.id === devID) { // I know what I sent
		logMessage(`[R] ${log}`);
	} else {
		sendMessage(me.dmChannel, log);
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
	server = await client.guilds.fetch(serverID);
});
client.on("message", function (message) {
	// Act on bot DMs
	if (message.guild === null && message.author.id !== botID) {
		logDM(message);
	}
	// Act on messages with the bot prefix
	if (message.content.substring(0, prefix.length) === prefix) {
		let content = message.content.substring(prefix.length);
		let command = content.split(" ", 1)[0];
		let args = content.substring(command.length + 1); // Keep the separating space out as well
		execute(server, message.author, command, args).then(reply => {
			if (reply) {
				sendMessage(message.channel, reply);
			}
		}).catch(error => {
			if (message.author.id !== devID) { // I have access to the logs
				sendMessage(message.channel, `Error: ${error}`);
			}
			logMessage(error, true);
		});
	}
});
client.login(token);