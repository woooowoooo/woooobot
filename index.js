const {prefix, token, myID, botID} = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
const me = client.users.fetch(myID);
client.once("ready", () => {
	console.log(`\n====================\nLogged in as ${client.user.tag}.\n`);
	me.then((result) => {
		console.log(result);
		result.send("Initialized");
		return result;
	});
});
client.on("message", msg => {
	if (msg.guild === null && msg.author.id != botID) { // Message is DM and not from the bot (to prevent a loop)
		console.log(`${msg.author.tag} said:\n${msg}`);
	}
	if (msg.content.substring(0, prefix.length) === prefix) {
		msg.channel.send(`Your message: **${msg.content.substring(prefix.length)}**.`);
	}
});
client.login(token);