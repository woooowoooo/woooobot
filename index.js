const {prefix, token, myID, serverID, botID} = require("./config.json");
const commands = require("./commands.js");
const Discord = require("discord.js");
const client = new Discord.Client();
const twow = client.guilds.fetch(serverID);
const me = client.users.fetch(myID);
function sendMessage(destination, message) { // Log into console all woooobot messages
	if (message.length > 2000) {
		console.log("Message is too long!");
		return;
	}
	destination.send(message);
	if (destination.type === "dm") {
		console.log(`[S] ${destination.recipient.tag}:\n	${message}`);
	} else { // If it's not a User or DM channel it's probably a text channel.
		console.log(`[S] ${destination.guild.name}, ${destination.name}:\n	${message}`);
	}
}
function logDM(message) {
	if (message.guild === null && message.author.id != botID) {
		const log = `${message.author.tag}:\n	${message}`;
		if (message.author.id === myID) { // I know what I sent
			console.log(`[R] ${log}`);
		} else {
			me.then(user => {
				sendMessage(user.dmChannel, message);
			});
		}
	}
}
client.once("ready", () => {
	console.log(`\n${'='.repeat(14 + client.user.tag.length)}\nLogged in as ${client.user.tag}.\n`);
});
client.on("message", msg => {
	// Act on bot DMs
	logDM(msg);
	// Act on messages with the bot prefix
	if (msg.content.substring(0, prefix.length) === prefix) {
		let content = msg.content.substring(prefix.length);
		let command = content.split(" ", 1)[0];
		let args = content.substring(command.length + 1); // Keep the separating space out as well
		twow.then(server => {
			let reply = commands.execute(server, msg.author, command, args);
			if (reply) {
				sendMessage(msg.channel, reply);
			}
		});
	}
});
client.login(token);