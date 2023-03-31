const {get} = require("https");
const {createWriteStream} = require("fs");
const {logMessage, sendMessage, toSnowflake, toUnixTime, getPaths, reload, save} = require("./helpers.js");
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
ping: Pings yourself.
\`\`\``;
		}
	},
	change: {
		permLevel: "developer",
		execute: async function ({text}) {
			let [path, keys, value] = text.split(" ");
			// Get object from path
			if (/..\//.test(path)) {
				throw new Error("You can't edit above miniTWOW-level!");
			}
			path = `./${path}`;
			let file = require(path);
			// Do the change
			let pointer = file;
			let traverse = function (keys, value) {
				let [key, ...rest] = keys;
				if (rest.length === 0) {
					pointer[key] = value;
					return;
				}
				if (!(key in pointer) || typeof pointer[key] !== "object") {
					throw new Error(`Cannot traverse into "${key}"!`);
				}
				traverse(rest, value);
			};
			traverse(keys.split("."), value);
			await save(path, file);
			logMessage(`Set ${path}:${keys} to ${value}`);
		}
	},
	editmsg: {
		permLevel: "developer",
		execute: async function ({text, message}) {
			const [channelId, messageId, ...newMessage] = text.split(" ");
			const channel = await message.guild.channels.fetch(channelId).catch(e => {
				throw new Error("Could not fetch channel in specified server! " + e);
			});
			const msg = await channel.messages.fetch(messageId).catch(e => {
				throw new Error("Could not fetch message from specified channel! " + e);
			});
			await msg.edit(newMessage.join(" ")).catch(e => {
				throw new Error("Message not editable! " + e);
			});
			return "Message edited!";
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
			if (!/\d+/.test(channelId)) {
				throw new Error("Invalid channel ID!");
			}
			sendMessage(channelId, message.join(" "), true);
		}
	},
	phase: {
		permLevel: "admin",
		execute: async function ({text: phase}) {
			let {seasonPath, roundPath} = require(twowPath + "status.json");
			let {respondingPath, votingPath, resultsPath, initsPath} = getPaths(seasonPath);
			if (phase === "responding") {
				await require(respondingPath).initResponding();
			} else if (phase === "voting") {
				await require(votingPath).initVoting();
			} else if (phase === "results") {
				await require(resultsPath).results();
			} else if (phase === "newRound") {
				await require(initsPath).initRound();
				({seasonPath, roundPath} = reload(twowPath + "status.json"));
				reload(seasonPath + "seasonConfig.json");
				reload(roundPath + "roundConfig.json");
				reload(respondingPath);
				reload(votingPath);
				reload(resultsPath);
				reload(initsPath);
			}
			reload(twowPath + "status.json");
		}
	},
	vote: {
		permLevel: "admin",
		execute: async function ({text}) {
			const [userId, messageId, ...vote] = text.split(" ");
			const message = {
				id: toSnowflake(messageId),
				content: vote.join(" "),
				createdAt: toUnixTime(messageId),
				author: {
					id: userId
				},
			};
			return require("./voting.js").logVote(message);
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
			const firstBook = (contestants.bookPaths[user.id] == null);
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
	name: {
		permLevel: "normal",
		execute: async function ({text: newName, message: {author: {id}}}) {
			if (newName == null) {
				throw new Error("New display name is missing!");
			}
			const {seasonPath} = require(twowPath + "status.json");
			const contestants = require(seasonPath + "seasonContestants.json");
			const oldName = contestants.names[id];
			contestants.names[id] = newName;
			await save(seasonPath + "seasonContestants.json", contestants);
			return `Name changed from \`${oldName}\` to \`${newName}\`!`;
		}
	},
	ping: {
		permLevel: "normal",
		execute: function ({message: {author: {id}}}) {
			return `<@${id}> :)`;
		}
	}
};
module.exports = async function (commandName, args, message, roles) {
	if (!(commandName in commands)) {
		throw new Error(`That isn't a valid command!`);
	}
	const command = commands[commandName];
	if (!hasPerms(message.author, message.guild, roles, command.permLevel)) {
		throw new Error("You aren't allowed to use this command!");
	}
	const output = await command.execute({message, text: args});
	if (message.guild != null && hasPerms(message.author, message.guild, roles, "admin") && (output.includes("@everyone") || output.includes("@here"))) {
		throw new Error(`You aren't allowed to ping @​${output.includes("@everyone") ? "everyone" : "here"}!`);
	}
	return output;
};