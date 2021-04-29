const {myID, roles} = require("./config.json");
const morshu = require("./morshu.js");
let hasPerms = function (server, user, permLevel) {
	if (permLevel === "normal") {
		return true;
	}
	if (permLevel === "developer") {
		return user.id === myID;
	}
	// I'll use "switch" if I add another case.
	server.members.fetch(user.id)
		.then(member => member.roles.has(roles[permLevel]))
		.catch(() => false);
};
let commands = {
	help: {
		permLevel: "normal",
		function: function (args) {
			return `Welcome to woooobot.
Woooobot was made to automate twoooowoooo.
Since I don't want to have this but running 24/7, **it will be offline most of the time.**
However, the bot should be online during results.
Use \`list\` to list all available commands.`;
		}
	},
	list: {
		permLevel: "normal",
		function: function (args) {
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
		function: function (args) {
			let command = args.text;
			try {
				if (command.substring(0, 3) === "```") { // Discord code blocks
					command = command.substring(3, command.length - 3);
				}
				eval(command);
			} catch (e) {
				throw `Error: Can't parse input command(s): "${command}"\n	${e}`;
			}
		},
	},
	ping: {
		permLevel: "normal",
		function: function (args) {
			let id = args.user.id;
			if (args.text) {
				if (args.text.substring(0,2) === "<@") { // User sends in a ping
					return args.text;
				}
				id = args.text;
			}
			return `<@${id}>`;
		},
	},
	echo: {
		permLevel: "normal",
		function: function (args) {
			if (args.text == "") {
				throw "\"message\" is missing!";
			}
			return args.text;
		}
	},
	morshu: {
		defaultArgs: "10",
		permLevel: "normal",
		function: function (args) {
			let words = Number(args.text);
			if (isNaN(words) || words <= 0) {
				throw `"${args.text}" is not a positive integer!`;
			}
			return morshu.generate(words);
		}
	}
}
exports.execute = async function (server, user, commandName, args) {
	if (!(commandName in commands)) {
		throw `There isn't a command named "${commandName}"!`;
	}
	let command = commands[commandName];
	if (!hasPerms(server, user, command.permLevel)) {
		throw "Your permissions aren't high enough for this command!";
	}
	let argsObj = {
		text: args,
		user: user,
		server: server
	}
	if (args == "" && "defaultArgs" in command) {
		argsObj.text = command.defaultArgs;
	}
	try {
		return command.function(argsObj);
	} catch (e) {
		throw e;
	}
}