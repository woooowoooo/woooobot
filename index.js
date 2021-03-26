const {prefix, token, myID, serverID, botID, logging} = require("./config.json");
const commands = require("./commands.js");
const Discord = require("discord.js");
const fs = require("fs");
const client = new Discord.Client();
let twow;
let me;
function logMessage(message, error) {
	let time = new Date();
	let timeString = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
	if (error) {
		console.error(`${timeString} Error: ${message}`);
	} else {
		console.log(`${timeString} ${message}`);
	}
	if (logging) {
		fs.appendFile("./log.txt", `${timeString} ${message}\n`, e => {
			if (e) {
				console.error(`${timeString} Error: ${e}`);
			}
		});
	}
}
function sendMessage(destination, message) {
	if (message.length > 2000) {
		logMessage("Message is too long!", true);
		return;
	}
	destination.send(message);
	if (destination.type === "dm") {
		logMessage(`[S] ${destination.recipient.tag}:\n	${message}`, false);
	} else { // If it's not a DM it's probably a text channel.
		logMessage(`[S] ${destination.guild.name}, ${destination.name}:\n	${message}`, false);
	}
}
function logDM(message) {
	if (message.guild === null && message.author.id != botID) {
		const log = `${message.author.tag}:\n	${message}`;
		if (message.author.id === myID) { // I know what I sent
			logMessage(`[R] ${log}`, false);
		} else {
			sendMessage(me.dmChannel, log);
		}
	}
}
client.once("ready", async function () {
	let time = new Date();
	let timeString = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
	let log = `${timeString} Logged in as ${client.user.tag}.`;
	let logFull = `\n${'='.repeat(log.length)}\n${log}\n`;
	console.log(logFull);
	if (logging) {
		fs.appendFile("./log.txt", `${logFull}\n`, e => {
			if (e) {
				console.error(`${timeString} Error: ${e}`);
			}
		});
	}
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