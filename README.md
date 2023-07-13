# woooobot
Made to automate twoooowoooo. Currently used to automate EndlessTWOW.

Documentation last updated on **2023-07-11**

Sample TWOW last updated **A LONG TIME AGO**

- [To-do List](docs/todo.md)
- [Config Files](docs/config-files.md)
- [File Structure](docs/file-structure.md)
- [Round Structure](docs/round-structure.md)

## How to Use
I never really intended for this to be used by anyone else, but if you want to use it, here's an incomplete outline of how.

### Prerequisites
- How to use Discord
- Knowledge of what a modern (mini)TWOW is
- Discord bot token (from the [Discord Developer Portal](https://discord.com/developers/applications))
- Basic terminal knowledge (what one is, how to run a command)
- `node.js` and `npm`
- (ideally) General programming knowledge (what code is, what an error is, how to debug, etc.)
- (optional) Basic knowledge of JavaScript
- (optional) Basic knowledge of `git`

### Setup
1. Clone (download) this repository onto your device.
2. Move it to a good location.
3. In the terminal, run `npm install` in the repository folder.
4. Create a file named `config.json` similar to the sample one.
5. Setup your TWOW's [file structure](docs/file-structure.md).

### Running
Run `node index.js` in the repository folder.

## Commands
Example table entry:
| Command | Description |
| --- | --- |
| `command <requiredArg> [optionalArg]` | Description `<argument>`. |

### Unrestricted
| Command | Description |
| --- | --- |
| `help` | Shows a welcome message. |
| `list` | Shows this command list. |
| `book` (attach exactly one file) | Records the attachment as your book. |
| `delete` | Deletes your response. |
| `echo <message>` | Repeats `<message>`. |
| `edit <newResponse>` | Edits your response to `<newResponse>`. | <!-- | `edit [responseNumber] <message>` | Edits your response. You must specify a `<responseNumber>` if you have submitted multiple responses. | -->
| `morshu [sentenceCount]` | Generates `<sentenceCount>` (one if unspecified) amount of [morshu sentences](#morshu). |
| `name <newName>` | Changes the name displayed during results for the current season to `<newName>`. |
| `ping` | Pings yourself. |
| `stat <statName> [possible arguments]` | [It's complicated (docs don't exist yet)](#stats) |

### Admin-only
| Command | Description |
| --- | --- |
| `phase <phase>` | Changes round status to `<phase>`. |
| `respond <userId> <messageId> <response>` | Records `<response>` as `<userId>`'s response, sent as message `<messageId>`. `<messageId>` may be in the form of a ISO 8601 time string. |
| `vote <userId> <messageId> <vote>` | Records `<vote>` as `<userId>`'s vote, sent as message `<messageId>`. `<messageId>` may be in the form of a ISO 8601 time string. |

### Developer-only
| Command | Description |
| --- | --- |
| `change <path> <keyString> <value>` | Changes the value of the property in file `<path>` at `<keyString>` to `<value>`. |
| `editmsg <channelId> <messageId> <newMessage>` | Edits the message `<messageId>` (in `<channelId>`) to `<newMessage>`. |
| `eval <code>` | Runs `<code>`. |
| `execute <messageArgs> <command>` | Executes `<command>` as if it were a message with properties `<messageArgs>`. |
| `log [date]` | Returns the log file for `<date>` (today if unspecified). |
| `reload` | Deletes the `require` cache of all non-node-module files. |
| `return <path> <keyString>` | Returns the value of the property in file `<path>` at `<keyString>`. |
| `send <channelId> <message>` | Sends `<message>` to `<channelId>`. |

### Morshu
Morshu sentences are grammatical (mostly) English sentences that only contain words spoken by Morshu in the CD-i game "Link: The Faces of Evil".
They are generated in [`morshu.js`](morshu.js).
If you run `node morshu.js`, it will generate ten morshu sentences.

### Stats
Basic syntax: `stat <statName> [range] | [args...] | [processor]`

If there is no processor, the latter pipe can be omitted, and there are no arguments, the former pipe can be omitted as well.

Examples:
- `stat responses "Round 3"` would return the list of responses for Round 3.
- `stat contestants "Round 12" || size` would return the number of contestants in Round 12.
- (NOT WORKING YET) `stat vpr "Round 1"-"Round 8"` would return the VPR of all rounds from Round 1 to Round 8.
	- `stat vpr "Round 1-Round 8"` is the workaround
- `stat wins "Sample Season" | 123456789123456789` would return the rounds of Sample Season that the user with snowflake 123456789123456789 won.
- `stat wins "Sample Season" | 123456789123456789 | size` would return the *amount* of rounds of Sample Season that the user with snowflake 123456789123456789 won.

### Execute
Currently `messageArgs` msut be of the form `"authorId messageId"`.
This is due to the way `parseArgs` works.

### Custom Commands
To add custom commands, create a file named `commands.js` in the season folder.
This file should export by default an object similar to the one exported in [`commands.js`](commands.js),
i.e. keys are command names, values are objects with an argument list, a description, a permission level, and a function named `execute`.