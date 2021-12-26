// Discord
const {Client, Intents} = require("discord.js");
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGES
	],
	partials: [
		"CHANNEL"
	]
});
exports.client = client; // Client is exported so helpers.js can use it
// Config modules
const {prefix, token, devID, botID, twows, currentTWOW} = require("./config.json"); // TODO: Allow for multiple TWOWs
const {id: serverID, roles, channels: {bots}} = require(`${twows[currentTWOW]}/twowConfig.json`);
// Function modules
const {getTime, logMessage, sendMessage} = require("./helpers.js");
const morshu = require("./morshu.js");
const {logResponse} = require("./responding.js");
const {logVote} = require("./voting.js");
let commands = require("./commands.js");
// Other variables
let me;
// Command parsing function
function parseCommands(text, message) {
	const command = text.split(" ", 1)[0];
	// Default parameters only act on "undefined" and not an empty string.
	const args = text.substring(command.length + 1) || undefined;
	// Reload commands
	if (command === "reload" && message.author.id === devID) {
		delete require.cache[require.resolve("./commands.js")];
		commands = require("./commands.js");
		logMessage("Commands reloaded.");
		return;
	}
	// Execute other commands
	commands(command, args, message, roles).then(reply => {
		if (reply != null) {
			sendMessage(message.channel, reply);
		}
	}).catch(e => {
		logMessage(`[E] ${e}`, true);
		if (message.author.id !== devID) { // I have access to the logs
			sendMessage(message.channel, e);
		}
	});
}
// Event handling
process.on("uncaughtException", e => {
	logMessage(`[E] ${e}\nStack trace is below:\n${e.stack}`, true);
});
client.once("ready", async function () {
	// Send startup messages to console
	const initLog = `Logged in as ${client.user.tag}.\n\n`;
	logMessage('='.repeat(initLog.length - 2));
	logMessage(initLog + morshu.generate(5) + '\n');
	// Initialize me
	me = await client.users.fetch(devID);
	me.createDM(); // To allow for console input to work
	// Act on recent DMs
	const server = await client.guilds.fetch(serverID);
	await server.members.fetch();
	const checkRole = await server.roles.fetch(roles.checkDMs);
	checkRole.members.forEach(async member => {
		const dms = await member.createDM();
		logMessage(`DM to ${member.user.tag} created.\n`);
		const messages = await dms.messages.fetch();
		messages.forEach(message => {
			logMessage(`[R] ${message.author.tag} at ${getTime(message.createdAt)}:\n	${message}`);
			// TODO: Act on messages
		});
	});
	// TODO: Update last checked time
});
client.on("messageCreate", function (message) {
	const author = message.author;
	const {phase} = require(`${twows[currentTWOW]}/status.json`);
	// Ignore own messages and non-bot channels
	if (author.id === botID || message.guild != null && !bots.includes(message.channel.id)) {
		return;
	}
	const serverHeader = message.guild != null ? ` in ${message.guild.name}, #${message.channel.name}` : "";
	logMessage(`[R] ${author.tag + serverHeader}:\n	${message}`);
	if (message.content.substring(0, prefix.length) === prefix) {
		// Act on bot commands
		parseCommands(message.content.substring(prefix.length), message);
	} else if (message.guild == null && author.id !== devID) {
		// Act on non-command direct messages
		sendMessage(me.dmChannel, `${author.tag}:\n${message}`);
		let result = (phase === "responding") ? logResponse(message, author) : logVote(message, author);
		sendMessage(message.author.dmChannel, result);
	}
});
client.login(token);
// Respond to console input
let stdin = process.openStdin();
stdin.addListener("data", function (text) {
	text = text.toString().trim();
	logMessage(`[R] Console input: ${text}`);
	if (text.substring(0, 2) !== "//") { // Allow for dev comments
		if (text.substring(0, prefix.length) === prefix) {
			text = text.substring(prefix.length);
		}
		parseCommands(text, {
			author: me,
			channel: me.dmChannel
		});
	}
});