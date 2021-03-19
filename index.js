const {prefix, token, myID, botID} = require("./config.json");
const morshu = require("./morshu.js");
const Discord = require("discord.js");
const client = new Discord.Client();
const me = client.users.fetch(myID).then(user => {
	console.log(user);
	return user;
});
function logMessage(message) { // Log into console all woooobot messages
	if (message.channel.type === "dm") {
		console.log(`[S] ${message.channel.recipient.tag}:\n	${message}`);
	} else { // If it's not a DM it's probably a text channel.
		console.log(`[S] ${message.channel.guild.name}, ${message.channel.name}:\n	${message}`);
	}
}
function logDM(message) {
	if (message.guild === null && message.author.id != botID) {
		const log = `[R] ${message.author.tag}:\n	${message}`;
		if (message.author.id === myID) { // I know what I sent
			console.log(log);
		} else {
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
		let content = msg.content.substring(prefix.length);
		let command = content.split(" ", 1)[0];
		let args = content.substring(command.length + 1); // Keep the separating space out as well
		let reply = "";
		switch (command) {
			case "help":
				reply = `
Welcome to woooobot. Here are the current available commands:
\`\`\`
ping: Ping yourself.
echo <message>: Repeats your message.
morshu <wordCount>: Generates <wordCount> amount of morshu words. Default amount is 10 words.
\`\`\`
				`;
				break;
			case "ping":
				reply = `<@${msg.author.id}>`;
				break;
			case "echo":
				reply = `Your message: **${args}**.`;
				break;
			case "morshu":
				if (Number.isInteger(Number(args)) && Number(args) > 0) {
					reply = morshu.generate(Number(args));
				} else if (args == "") {
					reply = morshu.generate(10);
				} else {
					reply = `I couldn't parse "${args}", so here's 10 words:\n${morshu.generate(10)}`;
				}
				break;
			case "default":
				reply = `Error: There isn't a command named ${command}.`;
				break;
		}
		msg.channel.send(reply).then(logMessage);
	}
});
client.login(token);