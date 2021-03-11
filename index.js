const {prefix, token, myID, botID} = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
const me = client.users.fetch(myID).then(user => {
	console.log(user);
	return user;
});
function log(message) { // Log into console all woooobot messages
	if (message.channel.type === "dm") {
		console.log(`(DM) To ${message.channel.recipient.tag}: ${message}`);
	}
	else { // If it's not a DM it's probably a text channel.
		console.log(`${message.channel.guild.name}, ${message.channel.name}: ${message}`);
	}
}
client.once("ready", () => {
	console.log(`\n${'=' * (13 + client.user.tag.length)}\nLogged in as ${client.user.tag}.\n`);
	me.then(user => user.send("Hello, world!").then(log));
});
client.on("message", msg => {
	if (msg.guild === null && msg.author.id != botID) { // Message is DM and not from the bot (to prevent a loop)
		console.log(`${msg.author.tag}: ${msg}`);
	}
	if (msg.content.substring(0, prefix.length) === prefix) {
		msg.channel.send(`Your message: **${msg.content.substring(prefix.length)}**.`).then(log);
	}
});
client.login(token);