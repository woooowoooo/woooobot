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
	server.members.fetch(user.id).then(member => {
		return member.roles.has(roles[permLevel]);
	}).catch(() => {
		return false;
	});
};
let commands = {
	help: {
		takesArgs: false,
		permLevel: "normal",
		function: function () {
			return `\`\`\`ldif
# Welcome to woooobot.

# Here is an example entry:
command requiredArg [optionalArg]: Description <argument>.

# Here are the current available commands:
ping [userId]: Ping <userId> if provided. Pings yourself otherwise.
echo message: Repeats <message>.
morshu [wordCount]: Generates <wordCount> amount of morshu words. Default amount is 10 words.
			\`\`\``;
		}
	},
	eval: {
		takesArgs: true,
		permLevel: "developer",
		function: function (args) {
			let command = args.text;
			try {
				if (command.substring(0, 3) === "```") { // Discord code blocks
					command = command.substring(3, command.length - 3);
				}
				eval(command);
			} catch (e) {
				console.log(`Error parsing input command(s): "${command}"\n	${e}`);
			}
		},
	},
	ping: {
		takesArgs: true,
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
		takesArgs: true,
		permLevel: "normal",
		function: function (args) {
			if (args.text == "") {
				return "Error: \"message\" is missing!";
			}
			return args.text;
		}
	},
	morshu: {
		takesArgs: true,
		defaultArgs: "10",
		permLevel: "normal",
		function: function (args) {
			let words = Number(args.text);
			if (isNaN(words) || words <= 0) {
				return `"Error: ${args.text}" is not a positive integer!`;
			}
			return morshu.generate(words);
		}
	}
}
exports.execute = function (server, user, commandName, args) {
	if (!(commandName in commands)) {
		return `Error: There isn't a command named ${commandName}!`;
	}
	let command = commands[commandName];
	if (!hasPerms(server, user, command.permLevel)) {
		return "Error: Your permissions aren't high enough for this command!";
	}
	let argsObj = {
		text: args,
		user: user,
		server: server
	}
	if (command.takesArgs) {
		if (args == "" && "defaultArgs" in command) {
			argsObj.text = defaultArgs;
		}
		return command.function(argsObj);
	}
	return command.function();
}