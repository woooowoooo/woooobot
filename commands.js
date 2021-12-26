const {client} = require("./index.js");
const {prefix, devID} = require("./config.json");
const morshu = require("./morshu.js");
const {initResponding} = require("./responding.js");
const {initVoting} = require("./voting.js");
const hasPerms = function (user, server, roles, permLevel) {
	if (permLevel === "normal") {
		return true;
	}
	if (permLevel === "developer") {
		return user.id === devID;
	}
	// I'll use "switch" if I add another case.
	return server.members.fetch(user.id)
		.then(member => member.roles.has(roles[permLevel]))
		.catch(() => false);
};
const commands = {
	help: {
		permLevel: "normal",
		execute: function () {
			return `Welcome to woooobot.
woooobot was made to automate twoooowoooo.
I don't want to have this bot running 24/7, so **it will be offline most of the time.**
However, the bot will be guaranteed online during results.
Use \`${prefix} list\` to list all available commands.`;
		}
	},
	list: {
		permLevel: "normal",
		execute: function () {
			return `\`\`\`ldif
# Here are the current available commands:

# Example list entry:
command <requiredArg> [optionalArg]: Description <argument>.

help: Show a welcome message.
list: Show this command list.

UNRESTRICTED:
echo <message>: Repeats <message>.
morshu [wordCount]: Generates <wordCount> amount of morshu words. Default amount is 10 words.
ping [userId]: Ping <userId> if provided. Pings yourself otherwise.

MODERATOR-ONLY:
edit <path> <key> <value>: Changes the value of <key> in <path> to <value>.
phase [newPhase]: Changes round status to <newPhase>. If no argument is provided, increments the phase.

DEVELOPER-ONLY:
eval <command>: Runs <command>.
reload: Reloads commands.js.
send <id> <text>: Sends <text> to <id>.
\`\`\``;
		}
	},
	eval: {
		permLevel: "developer",
		execute: function ({text: code}) {
			try {
				const singleLine = code.match(/^(`+)(?<code>.*)\1$/s)?.groups.code;
				const multiLine = code.match(/^(`{3,})(?:js|javascript)?\n(?<code>.*)\n\1$/s)?.groups.code;
				code = multiLine ?? singleLine ?? code;
				eval(code);
			} catch (e) {
				throw new EvalError(`Invalid input command(s):\n	${code}\n	${e}`);
			}
		}
	},
	send: {
		permLevel: "developer",
		execute: async function ({text}) {
			let [channelId, ...message] = text.split(" ");
			channelId = channelId.match(/^<#(?<id>\d+)>$/)?.groups.id ?? channelId;
			const channel = await client.channels.fetch(channelId);
			channel.send(message.join(" "));
			// TODO: Add DM functionality
		}
	},
	edit: {
		permLevel: "admin",
		execute: function ({text}) {
			let [path, key, value] = text.split(" ");
			if (path.match(/..\//)) {
				throw new Error("You can't edit above miniTWOW-level!");
			}
			path = `./${path}`;
			let file = require(path);
			file[key] = value;
			fs.writeFile(path, JSON.stringify(file, null, '\t'));
		}
	},
	phase: {
		permLevel: "admin",
		execute: function ({text: phase}) {
			if (phase === "responding") {
				initResponding();
			} else if (phase === "voting") {
				initVoting();
			}
		}
	},
	echo: {
		permLevel: "normal",
		execute: function ({text}) {
			if (text == null) {
				throw new Error("\"message\" is missing!");
			}
			return text;
		}
	},
	morshu: {
		permLevel: "normal",
		execute: function ({text: sentences = 1}) {
			if (isNaN(parseInt(sentences)) || sentences <= 0) {
				throw new Error(`"${sentences}" is not a positive integer!`);
			}
			return morshu.generate(sentences);
		}
	},
	ping: {
		permLevel: "normal",
		execute: function ({text, user: {id}}) {
			if (text != null) {
				if (text.substring(0,2) === "<@") { // User sends in a ping
					return text;
				}
				id = text;
			}
			return `<@${id}>`;
		}
	}
};
module.exports = async function (commandName, args, message, roles) {
	if (!(commandName in commands)) {
		throw new Error(`There isn't a command named "${commandName}"!`);
	}
	const command = commands[commandName];
	if (!hasPerms(message.author, message.guild, roles, command.permLevel)) {
		throw new Error("You aren't allowed to use this command!");
	}
	const argsObj = {
		text: args,
		user: message.author,
		server: message.guild
	};
	return command.execute(argsObj);
};