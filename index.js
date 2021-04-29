// Modules
const {prefix, token, myID, serverID, botID, logging} = require("./config.json");
const commands = require("./commands.js");
const Discord = require("discord.js");
const fs = require("fs");
// Other variables
const client = new Discord.Client();
let time = new Date();
const logStream = fs.createWriteStream(`./logs/${time.toISOString().substring(0, 10)}-${time.toISOString().substring(11, 19)}.log`, {
	"flags": "ax"
});
let twow;
let me;
// Helper functions
function logMessage(message, error = false) {
	time = new Date();
	let timeString = `${time.toISOString().substring(0, 10)} ${time.toISOString().substring(11, 19)}`;
	if (error) {
		console.error(`${timeString} [E] ${message}`);
	} else {
		console.log(`${timeString} ${message}`);
	}
	if (logging) {
		logStream.write(`${timeString} ${message}\n`);
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
function logDM(message) {
	if (message.guild === null && message.author.id != botID) {
		const log = `${message.author.tag}:\n	${message}`;
		if (message.author.id === myID) { // I know what I sent
			logMessage(`[R] ${log}`);
		} else {
			sendMessage(me.dmChannel, log);
		}
	}
}
// Event handling
process.on("uncaughtException", e => {
	console.log(`[E] ${e}`);
	// logMessage(e, true);
});
client.once("ready", async function () {
	let log = `Logged in as ${client.user.tag}.\n`;
	logMessage('='.repeat(log.length - 1));
	logMessage(log);
	me = await client.users.fetch(myID);
	twow = await client.guilds.fetch(serverID);
});
client.on("message", function (msg) {
	// Act on bot DMs
	logDM(msg);
	// Act on messages with the bot prefix
	if (msg.content.substring(0, prefix.length) === prefix) {
		let content = msg.content.substring(prefix.length);
		let command = content.split(" ", 1)[0];
		let args = content.substring(command.length + 1); // Keep the separating space out as well
		commands.execute(twow, msg.author, command, args).then(reply => {
			if (reply) {
				sendMessage(msg.channel, reply);
			}
		}).catch(error => {
			// if (msg.author.id !== myID) { // I have access to the logs
				sendMessage(msg.channel, `Error: ${error}`);
			// }
			logMessage(error, true);
		});
	}
});
client.login(token);