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
		exports.logMessage(`[E] Failed to add role ${role} to ${user} in ${server.name}`, true);
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
		exports.logMessage(`[E] Failed to remove role ${role} to ${user} in ${server.name}`, true);
	}
};
// Time
function getTimeType(time) {
	if (time == null) {
		return null;
	}
	if (time instanceof Date) {
		return "Date";
	}
	if (typeof time === "string" && time[10] === " " || time[10] === "T") {
		return "String";
	}
	const numberTime = BigInt(time);
	if (numberTime > (86400000n << 22n)) { // 1 day after Discord epoch
		return "Snowflake";
	}
	return "Unix";
}
// TimeString means ISO8601 without T and timezone
exports.toTimeString = function (time = new Date()) { // (Date | Snowflake | String | Unix | null) -> String
	switch (getTimeType(time)) {
		case "String":
			return time;
		case "Snowflake":
			time = exports.toUnixTime(time); // Fallthrough
		case "Unix":
			time = new Date(time * 1000); // Fallthrough
		case "Date":
			return time.toISOString().substring(0, 10) + " " + time.toISOString().substring(11, 19);
		default:
			throw new Error("Invalid time");
	}
};
exports.toSnowflake = function (time) { // (Snowflake | String | Unix | null) -> Snowflake
	switch (getTimeType(time)) {
		case "Snowflake":
			return time;
		case "String":
		case null:
			time = exports.toUnixTime(time); // Fallthrough
		case "Unix":
			return (BigInt(time - 1420070400) * 1000n << 22n).toString();
		default:
			throw new Error("Invalid time");
	}
};
exports.toUnixTime = function (time) { // (Snowflake | String | Unix | null) -> Unix
	switch (getTimeType(time)) {
		case "Snowflake":
			return Number((BigInt(time) >> 22n) / 1000n + 1420070400n);
		case "String":
			return Math.floor(new Date(time + "Z").getTime() / 1000); // "Z" to prevent timezone offset
		case "Unix":
			return time;
		case null:
			return Math.floor(Date.now() / 1000);
		default:
			throw new Error("Invalid time");
	}
};
// Require
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
// Miscellanous
exports.scramble = function (array) {
	const copy = [...array];
	for (let i = 0; i < copy.length; i++) { // Randomize response array
		const j = Math.floor(Math.random() * i);
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};