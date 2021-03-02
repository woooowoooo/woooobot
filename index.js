const config = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
client.once("ready", () => {
	console.log("Ready!");
});
client.on("message", message => {
	if (message.content.substring(0, config.prefix.length) === config.prefix) {
		message.channel.send("Hello. You have just said: **" + message.content.substring(config.prefix.length).trim() + "**.");
	}
});
client.login(config.token);