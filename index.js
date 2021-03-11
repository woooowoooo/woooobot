const {prefix, token, myID, botID} = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
const me = client.users.fetch(myID).then(user => {
	console.log(user);
	return user;
});
function log(message) { // Log into console all woooobot messages
	if (message.channel.type === "dm") {
		console.log(`(DM) To ${message.channel.recipient.tag}\n	${message}`);
	}
	else { // If it's not a DM it's probably a text channel.
		console.log(`${message.channel.guild.name}, ${message.channel.name}:\n	${message}`);
	}
}
client.once("ready", () => {
	console.log(`\n${'='.repeat(14 + client.user.tag.length)}\nLogged in as ${client.user.tag}.\n`);
});
client.on("message", msg => {
	// Act on bot DMs
	if (msg.guild === null && msg.author.id != botID) {
		if (msg.author.id === myID) { // I know what I sent
			console.log(`${msg.author.tag}:\n	${msg}`);
		}
		else {
			me.then(user => user.send(`${msg.author.tag}: ${msg}`)).then(log);
		}
	}
	// Act on server messages with the bot prefix
	if (msg.content.substring(0, prefix.length) === prefix) {
		msg.channel.send(`Your message: **${msg.content.substring(prefix.length)}**.`).then(log);
	}
});
client.login(token);