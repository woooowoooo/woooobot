const {get} = require("https");
const {createWriteStream} = require("fs");
const {logMessage, sendMessage, reload, save} = require("./helpers.js");
const morshu = require("./morshu.js");
const {prefix, devId, twowPath} = require("./config.json");
const {seasonPath} = require(twowPath + "status.json");
const contestants = require(seasonPath + "seasonContestants.json");
const hasPerms = function (user, server, roles, permLevel) {
	if (user.id === devId) {
		return true;
	}
	if (permLevel === "normal") {
		return true;
	}
	if (permLevel === "developer") {
		return false; // The first case already covers this
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
book (attach exactly one file): Record the attachment as your book.
echo <message>: Repeats <message>.
morshu [wordCount]: Generates <wordCount> amount of morshu words. Default amount is 10 words.
ping [userId]: Ping <userId> if provided. Pings yourself otherwise.

ADMIN-ONLY:
phase [newPhase]: Changes round status to <newPhase>. If no argument is provided, increments the phase.

DEVELOPER-ONLY:
change <path> <key> <value>: Changes the value of <key> in <path> to <value>.
edit <messageId> <channelId> <newMessage>: Edits the message <messageId> (in <channelId>) to <newMessage>.
eval <command>: Runs <command>.
reload: Reloads commands.js.
send <id> <text>: Sends <text> to <id>.
\`\`\``;
		}
	},
	change: {
		permLevel: "developer",
		execute: async function ({text}) {
			let [path, key, value] = text.split(" ");
			if (path.match(/..\//)) {
				throw new Error("You can't edit above miniTWOW-level!");
			}
			path = `./${path}`;
			let file = require(path);
			file[key] = value;
			await save(path, file);
			logMessage(file);
		}
	},
	edit: {
		permLevel: "developer",
		execute: async function ({text, message}) {
			const [channelId, messageId, ...newMessage] = text.split(" ");
			const channel = await message.guild.channels.fetch(channelId).catch(() => {
				throw new Error("Channel not in this server!");
			});
			const msg = await channel.messages.fetch(messageId).catch(() => {
				throw new Error("Message not in specified channel!");
			});
			await msg.edit(newMessage.join(" ")).catch(() => {
				throw new Error("Message not editable!");
			});
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
			channelId = channelId.match(/^<(#|@|@!)(?<id>\d+)>$/)?.groups.id ?? channelId;
			sendMessage(channelId, message.join(" "), true);
		}
	},
	phase: {
		permLevel: "admin",
		execute: function ({text: phase}) {
			if (phase === "responding") {
				require("./responding.js").initResponding();
			} else if (phase === "voting") {
				require("./voting.js").initVoting();
			}
			({phase} = reload(twowPath + "status.json"));
		}
	},
	book: {
		permLevel: "normal",
		execute: async function ({user, message: {attachments}}) {
			if (attachments.size !== 1) {
				throw new Error("Your message does not contain exactly one file attachment!");
			}
			const attachment = attachments.values().next().value;
			const firstBook = (contestants[user.id] == null);
			contestants.bookPaths[user.id] ??= `${user.username}.${attachments.first().name.split(".").at(-1)}`;
			await save(seasonPath + "seasonContestants.json", contestants);
			const book = createWriteStream(`${seasonPath}books/${contestants.bookPaths[user.id]}`);
			await new Promise(resolve => {
				get(attachment.url, response => {
					response.pipe(book);
					response.on("end", resolve);
				});
			});
			return `Book ${firstBook ? "saved" : "updated"}!`;
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
		server: message.guild,
		message: message
	};
	return await command.execute(argsObj);
};