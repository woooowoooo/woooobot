const {get} = require("https");
const {createWriteStream} = require("fs");
const {readFile} = require("fs/promises");
const {
	colors, logMessage, findFreePath, getPaths, save, reload,
	sendMessage, toTimeString, toSnowflake, toUnixTime, hasPerms, parseArgs
} = require("./helpers.js");
const {prefix, twowPath} = require("./config.json");
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
		cookArgs: function (args) {
			if (args.length === 0) {
				return "";
			}
			let text = " " + args.join(" ");
			text = text.replace(" [", ` ${colors.yellow}[`);
			text = text.replace(" (", ` ${colors.blue}(`);
			text = text.replace(" <", ` ${colors.red}<`);
			return text;
		},
		cook: function (text = "") {
			return text.replace(/(<[^>]*>)/g, `${colors.red}$1${colors.white}`);
		},
		execute: async function ({message, roles}) {
			// Sort commands into permission levels
			const permLevels = ["developer", "admin", "normal"];
			const levelCommands = Object.entries(commands).reduce((levelCommands, [name, command]) => {
				levelCommands[command.permLevel] ??= [];
				levelCommands[command.permLevel].push([name, command]);
				return levelCommands;
			}, {});
			// List commands per level
			let list = "";
			for (const level of permLevels) {
				if (await hasPerms(message.author, message.guild, roles, level)) {
					list += `\n\x1B[1;37m${level.toUpperCase()} COMMANDS${colors.reset}\n`;
					for (const [name, command] of levelCommands[level]) {
						list += `${colors.green}${name}${this.cookArgs(command.arguments)}${colors.white}: ${this.cook(command.description)}\n`;
					}
				}
			}
			return `\`\`\`ansi
${colors.reset}Here are the current available commands.

Example list entry:
${colors.green}command ${colors.red}<requiredArg> ${colors.yellow}[optionalArg]${colors.white}: Description ${colors.red}<argument>${colors.white}.
${list}\`\`\``;
		}
	},
	// Developer level
	change: {
		arguments: ["<path>", "<keyString>", "<value>"],
		description: "Changes the value of the property in file <path> at <keyString> to <value>.",
		permLevel: "developer",
		execute: async function ({args: [path, keyString, value]}) {
			// Get file from path
			if (/\.\.\//.test(path)) {
				throw new Error("You can't edit above woooobot level!");
			}
			path = `./${path}`;
			const file = require(path);
			// Traverse through keys
			const keys = keyString.split(".");
			let finalPointer = keys.slice(0, -1).reduce((pointer, key) => {
				if (typeof pointer[key] !== "object" || !(key in pointer)) {
					throw new Error(`Cannot traverse into \`${key}\`!`);
				}
				return pointer[key];
			}, file);
			// Validate value
			if (value === "undefined") {
				value = undefined;
			} else {
				try {
					value = JSON.parse(value);
				} catch {
					throw new Error(`\`${value}\` is not a valid JSON value!`);
				}
			}
			// Change value
			finalPointer[keys.at(-1)] = value;
			await save(path, file);
			reload();
			logMessage(`Set ${path}:${keyString} to ${value}`);
		}
	},
	editmsg: {
		arguments: ["<channelId>", "<messageId>", "<newMessage>"],
		description: "Edits the message <messageId> (in <channelId>) to <newMessage>.",
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
		description: "Runs <code>.",
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
		description: "Returns the log file for <date> (today if unspecified).",
		permLevel: "developer",
		execute: async function ({args: [date = toTimeString().slice(0, 10)]}) {
			try {
				return await readFile(`./logs/${date.slice(0, 7)}/${date}.log`);
			} catch {
				throw new Error("No log found!");
			}
		}
	},
	reload: {
		arguments: [],
		description: "Deletes the `require` cache of all non-node-module files.",
		permLevel: "developer",
		execute: function () {}
	},
	return: {
		arguments: ["<path>", "<keyString>"],
		description: "Returns the value of the property in file <path> at <keyString>.",
		permLevel: "developer",
		execute: async function ({args: [path, keyString]}) {
			// Get file from path
			if (/\.\.\//.test(path)) {
				throw new Error("You can't view values above woooobot level!");
			}
			path = `./${path}`;
			const keys = keyString.split(".");
			// Traverse through keys
			const value = keys.reduce((object, key) => {
				if (!(key in object)) {
					throw new Error(`Key \`${key}\` not found!`);
				}
				return object[key];
			}, require(path));
			// Stringify and return value
			const valueString = typeof value === "object" ? JSON.stringify(value, null, "\t") : value;
			logMessage(`Returned the property at ${path}:${keyString}, which had value \`${valueString}\``);
			return valueString;
		}
	},
	send: {
		arguments: ["<channelId>", "<message>"],
		description: "Sends <message> to <channelId>.",
		permLevel: "developer",
		execute: async function ({args: [channelId, message]}) {
			channelId = channelId.match(/^<(#|@|@!)(?<id>\d+)>$/)?.groups.id ?? channelId;
			if (!/\d+/.test(channelId)) {
				throw new Error("Invalid channel ID!");
			}
			sendMessage(channelId, message, true);
		}
	},
	// Admin level
	phase: {
		arguments: ["<phase>"],
		description: "Changes round status to <phase>.",
		permLevel: "admin",
		execute: async function ({args: [phase]}) {
			let {seasonPath} = require(twowPath + "status.json");
			let {respondingPath, votingPath, resultsPath, initsPath} = getPaths(seasonPath);
			if (phase === "responding") {
				await require(respondingPath).initResponding();
			} else if (phase === "voting") {
				await require(votingPath).initVoting();
			} else if (phase === "results") {
				await require(resultsPath).results();
			} else if (phase === "newRound") {
				await require(initsPath).initRound();
				reload();
				({seasonPath} = require(twowPath + "status.json"));
			}
			reload(twowPath + "status.json");
		}
	},
	respond: {
		arguments: ["<userId>", "<messageId>", "<response>"],
		description: "Records <response> as <userId>'s response, sent as message <messageId>.",
		permLevel: "admin",
		execute: async function ({args: [userId, messageId, response]}) {
			const {seasonPath} = require(twowPath + "status.json");
			const {respondingPath} = getPaths(seasonPath);
			const message = {
				id: toSnowflake(messageId),
				content: response,
				createdAt: toUnixTime(messageId),
				author: {
					id: userId,
					toString: () => userId
				},
				toString: () => response
			};
			const output = await require(respondingPath).logResponse(message);
			sendMessage(userId, output, true);
			return output;
		}
	},
	vote: {
		arguments: ["<userId>", "<messageId>", "<vote>"],
		description: "Records <vote> as <userId>'s vote, sent as message <messageId>.",
		permLevel: "admin",
		execute: async function ({args: [userId, messageId, vote]}) {
			const {seasonPath} = require(twowPath + "status.json");
			const {votingPath} = getPaths(seasonPath);
			const message = {
				id: toSnowflake(messageId),
				content: vote,
				createdAt: toUnixTime(messageId),
				author: {
					id: userId,
					toString: () => userId
				},
				toString: () => vote
			};
			const output = await require(votingPath).logVote(message);
			sendMessage(userId, output, true);
			return output;
		}
	},
	// Normal level
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
			const path = await findFreePath(`${seasonPath}books/${user.username}`, attachments.first().name.split(".").at(-1));
			contestants.bookPaths[user.id] = path.slice(path.lastIndexOf("books/") + 6);
			await save(seasonPath + "seasonContestants.json", contestants);
			const book = createWriteStream(path);
			await new Promise(resolve => get(attachment.url, response => {
				response.pipe(book);
				response.on("end", resolve);
			}));
			return `Book ${firstBook ? "saved" : "updated"}!`;
		}
	},
	delete: {
		arguments: [],
		description: "Deletes your response.",
		permLevel: "normal",
		execute: function ({message}) {
			const {deleteResponse} = require("./responding.js");
			return deleteResponse(message.author.id);
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
	edit: {
		arguments: ["<newResponse>"],
		description: "Edits your response to <newResponse>.",
		permLevel: "normal",
		execute: function ({args: [newResponse], message}) {
			const {editResponse} = require("./responding.js");
			message.content = newResponse;
			return editResponse(message);
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
		description: "Changes the name displayed during results for the current season to <newName>.",
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
			return await stats(statName, statArgs, message, roles);
		}
	}
};
module.exports = async function run(text, message, roles) {
	const commandName = text.split(" ", 1)[0];
	const argString = text.substring(commandName.length + 1);
	// Check if command exists
	if (!(commandName in commands)) {
		throw new Error(`That isn't a valid command!`);
	}
	const command = commands[commandName];
	// Check permissions
	if (!(await hasPerms(message.author, message.guild, roles, command.permLevel))) {
		throw new Error("You aren't allowed to use this command!");
	}
	// Execute comand
	const args = parseArgs(argString, command.arguments.length);
	const output = await command.execute({message, args, roles}); // I really don't like exposing `roles`, TODO: Rework `stats`
	// Check for pings in output
	if (message.guild != null && await hasPerms(message.author, message.guild, roles, "admin") && (output.includes("@everyone") || output.includes("@here"))) {
		throw new Error(`You aren't allowed to ping @​${output.includes("@everyone") ? "everyone" : "here"}!`);
	}
	return output;
};