// Logging
const fs = require("fs");
const {client} = require("./index.js");
const {logging, colorLogs, loggingPath, sandbox, devId, sandboxId} = require("./config.json");
const colors = {
	reset: "\x1B[0m",
	gray: "\x1B[30m",
	red: "\x1B[31m",
	green: "\x1B[32m",
	yellow: "\x1B[33m",
	blue: "\x1B[34m",
	magenta: "\x1B[35m",
	cyan: "\x1B[36m",
	white: "\x1B[37m",
	// Non-hardcoded colors
	error: "\x1B[31m", // Red
	dm: "\x1B[32m", // Green
	input: "\x1B[33m", // Yellow
	output: "\x1B[33m", // Yellow
	console: "\x1B[35m", // Magenta
	message: "\x1B[36m" // Cyan
};
exports.colors = colors;
const findColor = /(\x1B\[[\w;]+m)/g;
let buffer = "\n" + "─".repeat(50) + "\n\n";
let logStream = null;
let currentDay = "";
if (logging) {
	const time = new Date();
	makeLogFile(time).then(() => logStream.write(buffer));
}
async function makeLogFile(time) {
	const path = loggingPath + time.toISOString().substring(0, 7);
	await fs.promises.mkdir(path, {recursive: true});
	const timeString = exports.toTimeString(time);
	currentDay = timeString.substring(0, 10);
	logStream = fs.createWriteStream(`${path}/${currentDay}.log`, {flags: "a"});
}
exports.logMessage = function (message, color, multicolor = false) {
	if (Array.isArray(message)) {
		message = message.join("\n\t");
	}
	const timeDate = new Date();
	const time = exports.toTimeString(timeDate);
	// Log message to console
	const colorMessage = `\x1B[38;5;246m${time} ${colors[color] ?? color ?? colors.reset}${message}`;
	console.log(colorMessage + colors.console);
	// Do file stuff
	if (logging) {
		// If day has changed, create new log file
		if (time.substring(0, 10) !== currentDay) {
			makeLogFile(timeDate);
		}
		// Log message to file or to buffer if log file is not ready
		let logMessage = (colorLogs ? colorMessage : `${time} ${message}`) + "\n";
		if (!colorLogs && multicolor) {
			logMessage = logMessage.replaceAll(findColor, "");
		}
		if (logStream == null) {
			buffer += logMessage;
		} else {
			logStream.write(logMessage);
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
exports.sendMessage = async function (destination, message, id = false, longMessageName) {
	if (sandbox) {
		destination = await exports.resolveChannel(sandboxId);
	} else if (id) {
		destination = await exports.resolveChannel(destination);
	}
	if ((message.content?.length ?? message.length ?? 0) > 2000) {
		// Convert message contents to text file
		if (typeof message !== "object") {
			message = {content: message};
		}
		message.files ??= [];
		message.files.unshift({
			attachment: Buffer.from(message.content ?? message),
			name: longMessageName ?? "message.txt"
		});
		message.content = null;
	}
	const sentMessage = await destination.send(message);
	// Log message
	if (typeof message === "object") {
		message = JSON.stringify(message);
	}
	if (destination.isDMBased()) { // Channel is either DM or group DM
		exports.logMessage(`[S] ${destination.recipient?.tag ?? destination.recipients.map(user => user.tag).join(", ")}:\n	${colors.message}${message}`, "output", true);
	} else if (destination.isTextBased()) {
		exports.logMessage(`[S] ${destination.guild.name}, ${destination.name}:\n	${colors.message}${message}`, "output", true);
	} else { // Non-text channel
		exports.logMessage(`[S] ??? ${destination.guild?.name !== undefined ? destination.guild.name + ", " : ""}${destination.name}:\n	${colors.message}${message}`, "output", true);
		exports.logMessage(`[E] Not a text-based channel`, "error");
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
		exports.logMessage(`[E] Failed to add role ${role} to ${user} in ${server.name}`, "error");
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
		exports.logMessage(`[E] Failed to remove role ${role} to ${user} in ${server.name}`, "error");
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
		const cool = require(path);
		const uncool = require(defaultPath);
		return Object.assign({}, uncool, cool);
	} catch (e) {
		// exports.logMessage(`[E] Could not require the file at "${path}"`, "error");
		exports.logMessage(e, "error");
		return require(defaultPath);
	}
};
exports.optRequire = function (path, backup = null) {
	try {
		return require(path);
	} catch {
		exports.logMessage(`[E] Could not require the file at "${path}"`, "error");
		return backup;
	}
};
exports.reload = function (path) {
	if (path) {
		delete require.cache[require.resolve(path)];
		exports.logMessage(`"${path}" reloaded.`);
		return;
	}
	for (const key of Object.keys(require.cache)) {
		if (!key.includes("node_modules") && key.includes("woooobot") && !key.includes("index.js")) {
			delete require.cache[key];
		}
	}
	exports.logMessage(`All files reloaded.`);
};
exports.save = async function (path, content) {
	await fs.promises.writeFile(path, JSON.stringify(content, null, "\t"));
};
// Miscellanous
exports.hasPerms = async function (user, server, roles, permLevel) {
	if (user.id === devId) {
		return true;
	}
	if (permLevel === "normal") {
		return true;
	}
	if (permLevel === "developer") {
		return false; // The first case already covers this
	}
	// I'll use "switch" if I add another case.
	const member = await server.members.fetch(user.id);
	try {
		return member.roles.has(roles[permLevel]);
	} catch {
		return false;
	}
};
exports.parseArgs = function (text, amount) { // Split a string into arguments
	const regex = /(?<=\s|^)(?:"(?<quoted>[^"]+)"|(?<unquoted>\S+))(?=\s|$)/g; // Either double quotes or non-whitespace, separated by whitespace
	const args = [];
	if (text === "" || amount === 0) {
		return args;
	}
	// Add arguments (not using `matchAll` so quotes don't get removed at the end)
	while (args.length < amount - 1) {
		const groups = regex.exec(text)?.groups;
		if (groups == null) { //  Nothing left
			return args;
		}
		args.push(groups.unquoted ?? groups.quoted); // Matches are guaranteed to be one of the two
	}
	// Push rest of the string as final argument
	args.push(text.substring(regex.lastIndex).trim());
	return args;
};
exports.scramble = function (array) {
	const copy = [...array];
	for (let i = 0; i < copy.length; i++) { // Randomize response array
		const j = Math.floor(Math.random() * i);
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};
exports.ordinal = function (number) {
	if (number >= 11 && number <= 13) {
		return `${number}th`;
	}
	switch (number % 10) {
		case 1:
			return `${number}st`;
		case 2:
			return `${number}nd`;
		case 3:
			return `${number}rd`;
		default:
			return `${number}th`;
	}
};
exports.suffixPlural = function (collection) {
	return (collection.length ?? collection.size) !== 1 ? "s" : "";
};