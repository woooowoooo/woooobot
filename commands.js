const {get} = require("https");
const {createWriteStream} = require("fs");
const {logMessage, sendMessage, reload, save} = require("./helpers.js");
const {prefix, devId, twowPath} = require("./config.json");
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

book (attach exactly one file): Record the attachment as your book.
echo <message>: Repeats <message>.
morshu [sentenceCount]: Generates <sentenceCount> amount of morshu sentences. Default amount is one sentence.
ping [userId]: Ping <userId> if provided. Pings yourself otherwise.
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
		execute: async function ({text: phase}) {
			let {seasonPath, roundPath} = require(twowPath + "status.json");
			let {
				respondingPath = "./responding.js",
				votingPath = "./voting.js",
				resultsPath = "./results.js"
			} = require(seasonPath + "seasonConfig.json");
			if (phase === "responding") {
				await require(respondingPath).initResponding();
			} else if (phase === "voting") {
				await require(votingPath).initVoting();
			} else if (phase === "results") {
				await require(resultsPath).results();
			} else if (phase === "newRound") {
				await require("./inits.js").initRound();
				({seasonPath, roundPath} = reload(twowPath + "status.json"));
				({
					respondingPath = "./responding.js",
					votingPath = "./voting.js",
					resultsPath = "./results.js"
				} = reload(seasonPath + "seasonConfig.json"));
				reload(roundPath + "roundConfig.json");
				reload("./inits.js");
				reload(respondingPath);
				reload(votingPath);
				reload(resultsPath);
			}
			reload(twowPath + "status.json");
		}
	},
	vote: {
		permLevel: "admin",
		execute: async function ({text}) {
			const [userId, messageId, ...vote] = text.split(" ");
			const message = {
				id: messageId,
				content: vote.join(" "),
				createdAt: toUnixTime(messageId),
				author: {
					id: userId
				},
			};
			require("./voting.js").logVote(message);
		}
	},
	book: {
		permLevel: "normal",
		execute: async function ({message: {author: user, attachments}}) {
			const {seasonPath} = require(twowPath + "status.json");
			const contestants = require(seasonPath + "seasonContestants.json");
			if (attachments.size !== 1) {
				throw new Error("Your message does not contain exactly one file attachment!");
			}
			const attachment = attachments.values().next().value;
			const firstBook = (contestants[user.id] == null);
			contestants.bookPaths[user.id] ??= `${user.username}.${attachments.first().name.split(".").at(-1)}`;
			await save(seasonPath + "seasonContestants.json", contestants);
			const book = createWriteStream(`${seasonPath}books/${contestants.bookPaths[user.id]}`);
			await new Promise(resolve => get(attachment.url, response => {
				response.pipe(book);
				response.on("end", resolve);
			}));
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
			return require("./morshu.js").generate(sentences);
		}
	},
	ping: {
		permLevel: "normal",
		execute: function ({text, message: {author: {id}}}) {
			let ping = `\`${text}\``; // Default text
			if (text == null) { // No text provided
				ping = `<@${id}>`;
			} else if (text.test(/^<@\d+>$/)) { // One ping
				ping = text;
			} else if (text.test(/^\d+$/)) { // One id
				ping = `<@${text}>`;
			}
			return ping + `. Sent by <@${id}> :)`;
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
	const output = await command.execute({message, text: args});
	if (hasPerms(message.author, message.guild, roles, "admin") && (output.includes("@everyone") || output.includes("@here"))) {
		throw new Error(`You aren't allowed to ping @​${output.includes("@everyone") ? "everyone" : "here"}!`);
	}
	return output;
};