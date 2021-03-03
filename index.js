const {prefix, token, myID, botID} = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
client.once("ready", () => {
	console.log("Ready!");
});
client.on("message", msg => {
	if (msg.content.substring(0, prefix.length) === prefix) {
		msg.channel.send(`Your message: **${msg.content.substring(prefix.length)}**.`);
	}
});
client.login(token);