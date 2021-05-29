const {devID} = require("./config.json");
const hasPerms = function (server, roles, user, permLevel) {
const morshu = require("./morshu.js");
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
Woooobot was made to automate twoooowoooo.
Since I don't want to have this but running 24/7, **it will be offline most of the time.**
However, the bot should be online during results.
Use \`list\` to list all available commands.`;
		}
	},
	list: {
		permLevel: "normal",
		execute: function () {
			return `\`\`\`ldif
# Here are the current available commands:

# Example list entry:
command requiredArg [optionalArg]: Description <argument>.

help: Show a welcome message.
list: Show this command list.
ping [userId]: Ping <userId> if provided. Pings yourself otherwise.
echo message: Repeats <message>.
morshu [wordCount]: Generates <wordCount> amount of morshu words. Default amount is 10 words.
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
		},
	},
	ping: {
		permLevel: "normal",
		execute: function ({text, user: {id}}) {
			if (text) {
				if (text.substring(0,2) === "<@") { // User sends in a ping
					return text;
				}
				id = text;
			}
			return `<@${id}>`;
		},
	},
	echo: {
		permLevel: "normal",
		execute: function ({text}) {
			if (text === "") {
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
	}
};
module.exports = async function (server, roles, user, commandName, args) {
	if (!(commandName in commands)) {
		throw new Error(`There isn't a command named "${commandName}"!`);
	}
	const command = commands[commandName];
	if (!hasPerms(server, roles, user, command.permLevel)) {
		throw new Error("You aren't allowed to use this command!");
	}
	const argsObj = {
		text: args,
		user: user,
		server: server
	};
	return command.execute(argsObj);
};