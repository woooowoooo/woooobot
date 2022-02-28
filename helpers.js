// Logging
const fs = require("fs");
const {client} = require("./index.js");
const {logging, sandbox} = require("./config.json");
let logStream;
if (logging != null) {
	const time = new Date();
	const path = logging + time.toISOString().substring(0, 7);
	fs.promises.mkdir(path, {recursive: true}).then(() => {
		logStream = fs.createWriteStream(`${path}/${exports.getTime(time).replace(/\s/g, "-")}.log`, {flags: "ax"});
	});
}
exports.logMessage = function (message, error = false) {
	if (Array.isArray(message)) {
		message = message.join("\n\t");
	}
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
exports.resolveChannel = async function (id) {
	try {
		return await client.channels.fetch(id);
	} catch {
		const user = await client.users.fetch(id);
		return await user.createDM();
	}
};
exports.sendMessage = async function (destination, message, id = false) {
	if (sandbox != null) {
		destination = await exports.resolveChannel(sandbox);
	} else if (id) {
		destination = await exports.resolveChannel(destination);
	}
	if ((message.content?.length ?? message.length ?? 0) > 2000) {
		throw new Error("Message is too long!");
	}
	await destination.send(message);
	// Log message
	if (typeof message === "object") {
		message = JSON.stringify(message);
	}
	if (destination.type === "DM") {
		exports.logMessage(`[S] ${destination.recipient.tag}:\n	${message}`);
	} else { // If it's not a DM it's probably a text channel.
		exports.logMessage(`[S] ${destination.guild.name}, ${destination.name}:\n	${message}`);
	}
};
exports.addRole = async function (server, user, role) {
	if (typeof server === "string") {
		server = await client.guilds.fetch(server);
	}
	try {
		const member = await server.members.fetch(user);
		member.roles.add(role);
	} catch {
		logMessage(`Failed to add role ${role} to ${user} in ${server.name}.`, true);
	}
};
// Time
exports.getTime = function (time = new Date()) {
	if (typeof time === "number") { // Is Unix time
		time = new Date(time * 1000);
	}
	return time.toISOString().substring(0, 10) + " " + time.toISOString().substring(11, 19);
};
exports.toSnowflake = function (time) {
	const unixTime = Math.floor(exports.toUnixTime(time));
	// Convert to Discord epoch
	return (BigInt(unixTime - 1420070400) << 22n).toString() + "000";
};
exports.toUnixTime = function (time) {
	if (time == null) {
		return Date.now() / 1000;
	}
	return new Date(time + "Z").getTime() / 1000; // + "Z" to prevent timezone offset
};
// Miscellaneous
exports.reload = function (path) {
	delete require.cache[require.resolve(path)];
	exports.logMessage(`${path} reloaded.`);
	return require(path);
};
exports.save = async function (path, content) {
	await fs.promises.writeFile(path, JSON.stringify(content, null, "\t"));
};