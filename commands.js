const {get} = require("https");
const {createWriteStream} = require("fs");
const {readFile} = require("fs/promises");
const {logMessage, sendMessage, toTimeString, toSnowflake, toUnixTime, getPaths, reload, save, parseArgs} = require("./helpers.js");
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
		arguments: [],
		description: "Show a welcome message.",
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
		arguments: [],
		description: "Show this command list.",
		permLevel: "normal",
		execute: function () {
			let list = "";
			for (const [name, command] of Object.entries(commands)) {
				if (command.permLevel === "normal") {
					list += `${name}${command.arguments.length > 0 ? ` ${command.arguments.join(" ")}` : ""}: ${command.description}\n`;
				}
			}
			return `\`\`\`ldif
# Here are the current available commands:

# Example list entry:
command <requiredArg> [optionalArg]: Description <argument>.

${list}\`\`\``;
		}
	},
	change: {
		arguments: ["<path>", "<keys>", "<value>"],
		permLevel: "developer",
		execute: async function ({args: [path, keys, value]}) {
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
		arguments: ["<channelId>", "<messageId>", "<newMessage>"],
		permLevel: "developer",
		execute: async function ({args: [channelId, messageId, newMessage], message}) {
			const channel = await message.guild.channels.fetch(channelId).catch(e => {
				throw new Error("Could not fetch channel in specified server! " + e);
			});
			const msg = await channel.messages.fetch(messageId).catch(e => {
				throw new Error("Could not fetch message from specified channel! " + e);
			});
			await msg.edit(newMessage).catch(e => {
				throw new Error("Message not editable! " + e);
			});
			return "Message edited!";
		}
	},
	eval: {
		arguments: ["<code>"],
		permLevel: "developer",
		execute: function ({args: [code]}) {
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
	log: {
		arguments: ["[date]"],
		permLevel: "developer",
		execute: async function ({args: [date = toTimeString().slice(0, 10)]}) {
			try {
				return await readFile(`./logs/${date.slice(0, 7)}/${date}.log`);
			} catch {
				throw new Error("No log found!");
			}
		}
	},
	send: {
		arguments: ["<channelId>", "<message>"],
		permLevel: "developer",
		execute: async function ({args: [channelId, message]}) {
			channelId = channelId.match(/^<(#|@|@!)(?<id>\d+)>$/)?.groups.id ?? channelId;
			if (!/\d+/.test(channelId)) {
				throw new Error("Invalid channel ID!");
			}
			sendMessage(channelId, message, true);
		}
	},
	phase: {
		arguments: ["<phase>"],
		permLevel: "admin",
		execute: async function ({args: [phase]}) {
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
		arguments: ["<userId>", "<messageId>", "<vote>"],
		permLevel: "admin",
		execute: async function ({args: [userId, messageId, vote]}) {
			const message = {
				id: toSnowflake(messageId),
				content: vote,
				createdAt: toUnixTime(messageId),
				author: {
					id: userId,
					toString: () => userId,
				},
				toString: () => vote,
			};
			return require("./voting.js").logVote(message);
		}
	},
	book: {
		arguments: ["(attach exactly one file)"],
		description: "Record the attachment as your book.",
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
		arguments: ["<message>"],
		description: "Repeats <message>.",
		permLevel: "normal",
		execute: function ({args: [text]}) {
			if (text == null) {
				throw new Error("\"message\" is missing!");
			}
			return text;
		}
	},
	morshu: {
		arguments: ["[sentenceCount]"],
		description: "Generates <sentenceCount> (one if unspecified) amount of morshu sentences.",
		permLevel: "normal",
		execute: function ({args: [sentences = 1]}) {
			if (isNaN(parseInt(sentences)) || sentences <= 0) {
				throw new Error(`"${sentences}" is not a positive integer!`);
			}
			return require("./morshu.js").generate(sentences);
		}
	},
	name: {
		arguments: ["<newName>"],
		description: "Changes the name displayed during results for the current season to `<newName>`.",
		permLevel: "normal",
		execute: async function ({args: [newName], message: {author: {id}}}) {
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
		arguments: [],
		description: "Pings yourself.",
		permLevel: "normal",
		execute: function ({message: {author: {id}}}) {
			return `<@${id}> :)`;
		}
	},
	stat: {
		arguments: ["<statName>", "[statArgs]"],
		description: "UNFINISHED",
		permLevel: "normal",
		execute: async function ({args: [statName, statArgs], message, roles}) {
			const stats = require("./statistics.js");
			if (statName == null) {
				throw new Error("Statistic name is missing!");
			}
			// Special stat: list all statistics
			if (statName === "list") {
				let list = "";
				for (const [name, {description}] of Object.entries(stats)) {
					list += `${name}: ${description}\n`;
				}
				return `Available statistics: \`\`\`${list}\`\`\``;
			}
			// Check if statistic exists
			if (!(statName in stats)) {
				throw new Error(`Invalid statistic!`);
			}
			const stat = stats[statName];
			// Check permissions
			if (!hasPerms(message.author, message.guild, roles, stat.permLevel)) {
				throw new Error("You aren't allowed to see this statistic!");
			}
			// Execute statistic command
			return stat.execute(statArgs).toString();
		}
	}
};
module.exports = async function (commandName, argText, message, roles) {
	if (!(commandName in commands)) {
		throw new Error(`That isn't a valid command!`);
	}
	const command = commands[commandName];
	if (!hasPerms(message.author, message.guild, roles, command.permLevel)) {
		throw new Error("You aren't allowed to use this command!");
	}
	const args = parseArgs(argText, command.arguments.length);
	const output = await command.execute({message, args, roles}); // I really don't like exposing `roles`, TODO: Rework `stats`
	if (message.guild != null && hasPerms(message.author, message.guild, roles, "admin") && (output.includes("@everyone") || output.includes("@here"))) {
		throw new Error(`You aren't allowed to ping @​${output.includes("@everyone") ? "everyone" : "here"}!`);
	}
	return output;
};