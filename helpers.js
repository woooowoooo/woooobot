// Logging
const fs = require("fs");
const {client} = require("./index.js");
const {logging, loggingPath, sandbox, sandboxId} = require("./config.json");
let logStream = "";
if (logging) {
	const time = new Date();
	const path = loggingPath + time.toISOString().substring(0, 7);
	fs.promises.mkdir(path, {recursive: true}).then(() => {
		let buffer = logStream;
		logStream = fs.createWriteStream(`${path}/${exports.toTimeString(time).replace(/\s/g, "-")}.log`, {flags: "ax"});
		logStream.write(buffer);
	});
}
exports.logMessage = function (message, error = false) {
	if (Array.isArray(message)) {
		message = message.join("\n\t");
	}
	const time = exports.toTimeString();
	if (error) {
		console.error(`${time} ${message}`);
	} else {
		console.log(`${time} ${message}`);
	}
	if (logging) {
		if (typeof logStream === "string") {
			logStream += `${time} ${message}\n`;
		} else {
			logStream.write(`${time} ${message}\n`);
		}
	}
};
// Discord.js
exports.resolveChannel = async function (id) {
	try {
		return await client.channels.fetch(id);
	} catch { // Error message (Cannot read properties of undefined (reading 'includes') is still logged
		const user = await client.users.fetch(id);
		return await user.createDM();
	}
};
exports.sendMessage = async function (destination, message, id = false) {
	if (sandbox) {
		destination = await exports.resolveChannel(sandboxId);
	} else if (id) {
		destination = await exports.resolveChannel(destination);
	}
	if ((message.content?.length ?? message.length ?? 0) > 2000) {
		throw new Error("Message is too long!");
	}
	const sentMessage = await destination.send(message);
	// Log message
	if (typeof message === "object") {
		message = JSON.stringify(message);
	}
	if (destination.isDMBased()) { // Channel is either DM or group DM
		exports.logMessage(`[S] ${destination.recipient?.tag ?? destination.recipients.map(user => user.tag).join(", ")}:\n	${message}`);
	} else if (destination.isTextBased()) {
		exports.logMessage(`[S] ${destination.guild.name}, ${destination.name}:\n	${message}`);
	} else { // Non-text channel
		exports.logMessage(`[S] ??? ${destination.guild?.name !== undefined ? destination.guild.name + ", " : ""}${destination.name}:\n	${message}`);
		exports.logMessage(`[E] Not a text-based channel`, true);
	}
	return sentMessage;
};
exports.addRole = async function (server, user, role) {
	if (typeof server === "string") {
		server = await client.guilds.fetch(server);
	}
	try {
		const member = await server.members.fetch(user);
		member.roles.add(role);
	} catch {
		logMessage(`[E] Failed to add role ${role} to ${user} in ${server.name}`, true);
	}
};
exports.removeRole = async function (server, user, role) {
	if (typeof server === "string") {
		server = await client.guilds.fetch(server);
	}
	try {
		const member = await server.members.fetch(user);
		member.roles.remove(role);
	} catch {
		logMessage(`[E] Failed to remove role ${role} to ${user} in ${server.name}`, true);
	}
};
// Time
exports.toTimeString = function (time = new Date()) { // (Unix | null) -> String // ISO8601 without T and timezone
	if (typeof time === "number") { // Unix -> Date -> String
		time = new Date(time * 1000);
	}
	return time.toISOString().substring(0, 10) + " " + time.toISOString().substring(11, 19); // Date -> String
};
exports.toSnowflake = function (time) { // (String | Unix | null) -> Snowflake
	if (time == null || typeof time === "string") { // (String | null) -> Unix -> Snowflake
		time = Math.floor(exports.toUnixTime(time));
	}
	// Convert to Discord epoch
	return (BigInt(time - 1420070400) * 1000n << 22n).toString(); // Unix -> Snowflake
};
exports.toUnixTime = function (time) { // (Snowflake | String | null) -> Unix
	if (time == null) { // null -> Unix
		return Date.now() / 1000;
	}
	if (typeof time === "string" && time[10] !== " ") { // Snowflake -> Unix
		return Number((BigInt(time) >> 22n) / 1000n + 1420070400n);
	}
	return new Date(time + "Z").getTime() / 1000; // String -> Unix // + "Z" to prevent timezone offset
};
// Miscellaneous
exports.getPaths = function (seasonPath) {
	const paths = {
		respondingPath: "./responding.js",
		votingPath: "./voting.js",
		resultsPath: "./results.js",
		initsPath: "./inits.js"
	};
	for (const key of Object.keys(paths)) {
		if (fs.existsSync(seasonPath + paths[key])) {
			paths[key] = seasonPath + paths[key];
		}
	}
	return paths;
};
exports.defaultRequire = function (path, defaultPath) {
	try {
		let cool = require(path);
		let uncool = require(defaultPath);
		return Object.assign({}, uncool, cool);
	} catch (e) {
		// exports.logMessage(`[E] Could not require the file at "${path}"`, true);
		exports.logMessage(e, true);
		return require(defaultPath);
	}
};
exports.optRequire = function (path, backup = null) {
	try {
		return require(path);
	} catch {
		exports.logMessage(`[E] Could not require the file at "${path}"`, true);
		return backup;
	}
};
exports.reload = function (path) {
	delete require.cache[require.resolve(path)];
	exports.logMessage(`${path} reloaded.`);
	return require(path);
};
exports.save = async function (path, content) {
	await fs.promises.writeFile(path, JSON.stringify(content, null, "\t"));
};