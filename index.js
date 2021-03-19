const {prefix, token, myID, botID} = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
const me = client.users.fetch(myID).then(user => {
	console.log(user);
	return user;
});
function logMessage(message) { // Log into console all woooobot messages
	if (message.channel.type === "dm") {
		console.log(`[S] ${message.channel.recipient.tag}\n	${message}`);
	}
	else { // If it's not a DM it's probably a text channel.
		console.log(`[S] ${message.channel.guild.name}, ${message.channel.name}:\n	${message}`);
	}
}
function logDM(message) {
	if (message.guild === null && message.author.id != botID) {
		const log = `[R] ${message.author.tag}:\n	${message}`;
		if (message.author.id === myID) { // I know what I sent
			console.log(log);
		}
		else {
			me.then(user => user.send(log)).then(logMessage);
		}
	}
}
client.once("ready", () => {
	console.log(`\n${'='.repeat(14 + client.user.tag.length)}\nLogged in as ${client.user.tag}.\n`);
});
client.on("message", msg => {
	// Act on bot DMs
	logDM(msg);
	// Act on server messages with the bot prefix
	if (msg.content.substring(0, prefix.length) === prefix) {
		msg.channel.send(`Your message: **${msg.content.substring(prefix.length)}**.`).then(logMessage);
	}
});
client.login(token);