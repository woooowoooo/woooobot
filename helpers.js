// Logging
const fs = require("fs");
const {client} = require("./index.js");
const {logging} = require("./config.json");
let logStream;
if (logging != null) {
	const time = new Date();
	const path = `${logging}/${time.toISOString().substring(0, 7)}`;
	fs.promises.mkdir(path, {recursive: true}).then(() => {
		logStream = fs.createWriteStream(`${path}/${exports.getTime(time).replace(/\s/g, "-")}.log`, {flags: "ax"});
	});
}
exports.getTime = function (time = new Date()) {
	return time.toISOString().substring(0, 10) + ' ' + time.toISOString().substring(11, 19);
};
exports.logMessage = function (message, error = false) {
	const time = exports.getTime();
	if (error) {
		console.error(`${time} ${message}`);
	} else {
		console.log(`${time} ${message}`);
	}
	if (logging != null) {
		logStream.write(`${time} ${message}\n`);
	}
};
// Discord.js
exports.sendMessage = function (destination, message, id = false) {
	if (id) {
		client.channels.fetch(destination).then(channel => {
			exports.sendMessage(channel, message);
		});
		return;
	}
	if (message.length > 2000) {
		throw new Error("Message is too long!");
	}
	destination.send(message);
	if (destination.type === "DM") {
		exports.logMessage(`[S] ${destination.recipient.tag}:\n	${message}`);
	} else { // If it's not a DM it's probably a text channel.
		exports.logMessage(`[S] ${destination.guild.name}, ${destination.name}:\n	${message}`);
	}
};