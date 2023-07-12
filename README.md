# woooobot
Made to automate twoooowoooo. Currently used to automate EndlessTWOW.

Here's the to-do list: [to-do](docs/todo.md)

**DOCS LAST UPDATED ON 2023-07-09**

**SAMPLE TWOW LAST UPDATED A LONG TIME AGO**

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
5. Setup your TWOW's file structure.

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
- (NOT WORKING YET) `stat listWins "Sample Season" | 123456789123456789` would return the rounds of Sample Season that the user with snowflake 123456789123456789 won.
- (NOT WORKING YET) `stat listWins "Sample Season" | 123456789123456789 | size` would return the *amount* of rounds of Sample Season that the user with snowflake 123456789123456789 won.

### Custom Commands
To add custom commands, create a file named `commands.js` in the season folder.
This file should export by default an object similar to the one exported in [`commands.js`](commands.js),
i.e. keys are command names, values are objects with an argument list, a description, a permission level, and a function named `execute`.

## TWOW Directory Structure
TWOWs > Seasons > Rounds

To add TWOWs, edit `config.json`.
See [`sampleConfig.json`](sampleConfig.json) for an example.

For a list of properties for each config file, see [`config-files.md`](docs/config-files.md).

### (Mini)TWOWs
TWOW names and paths should specified in `config.json`.
An example TWOW can be seen at [`Sample TWOW/`](Sample%20TWOW).
TWOW folders consist of the following:
- Seasons
- `twowConfig.json`
- `status.json`
- `queue.json`
- `nextSeason.json`

`twowConfig.json` deals with the configuration of the Discord server the miniTWOW will be held in.
*All seasons must be held in this server.*

### Seasons
Season names and paths should be specified in the TWOW's `twowConfig.json`.
To use custom responding (or voting, etc.) for a season, put a `responding.js` (or `voting.js`, etc.) in the season folder.
Season folders consist of the following:
- Rounds
- `books` folder
- `seasonConfig.json`
- `seasonContestants.json`
- `graphics.js`
- (Optional) `responding.js`
- (Optional) `voting.js`
- (Optional) `results.js`
- (Optional) `commands.js`
- (Optional) `inits.js`
- (Optional) `technicals.js`
- (Optional) `twists.js`

### Rounds
Round names and paths should be specified in the season's `seasonConfig.json`.
Round folders consist of the following:
- `results` folder
- `screens` folder
- `roundConfig.json`
- `contestants.json`
- `responses.json`
- `results.json`
- `screens.json`
- `votes.json`

## Round structure
Each round consists of two phases: responding and voting.
There is a special phase called "both" that allows for simultaneous responding and voting.
Results happen after the voting phase concludes.
After results, the next round begins.
If `autoDeadlines` in `seasonConfig.json` is set to true, these phases will be incremented automatically, following the `rDeadline` and `vDeadline` set in `roundConfig.json`.
`rDeadline` and `vDeadline` are automatically generated following the configured `deadlines` in `seasonConfig.json`, but can be manually configured.

### Responding
When the responding phase begins, the bot will post the prompt in the prompts channel.
If the prompt has a specified author in `roundConfig.json`, the bot will post that field verbatim.
Therefore, if you want to ping the author, set `author` in `roundConfig.json` to `<@SNOWFLAKE>` where `SNOWFLAKE` is replaced with the author's Discord snowflake.
If there is an example response, it will be posted as well.
If there are technicals and/or twists, their titles and descriptions will be posted as well.

#### Technicals
A "technical" is a rule that must be followed when responding to a prompt.
Responses that do not follow the technical are not recorded.
By default, a ten word limit technical is imposed on responses.
To cancel this behavior, add `noTenWord` to the list of technicals to be used in `roundConfig.json`.
All technicals that are not the ten word limit inherent in the definition of TWOW must be defined in `technicals.js` in the season folder.
An example `technicals.js` can be found [in the sample season](Sample%20TWOW/Sample%20Season/technicals.js).

#### Twists
A "twist" in the context of woooobot is defined as a function that modifies a response when it is recorded.
Note that woooobot uses a narrow definition of twist.
All twists must be defined in `twists.js` in the season folder.
An example `twists.js` can be found [in the sample season](Sample%20TWOW/Sample%20Season/twists.js).

### Voting
When the voting phase begins, the bot will send all voting screens as separate images to the voting channel.
If `megascreen` is enabled, a screen that contains every response in the round will be made.
A text version of the megascreen will be also be sent to facilitate use of https://voter.figgyc.uk/.

### Results
When results begins, first the title slide and leaderboard will be created.
Start results by sending `start`.
This will activate the results CLI and send a ping to the results channel.
After results are finished by sending `end`, the bot will post the full leaderboard (generated at the beginning) in the results channel, as well as in the leaderboard channel if a `leaderboards` channel id is defined in `twowConfig.json`.

It will then post a 50 message "spoiler wall" in the results channel, consisting of 49 ["morshu sentences"](#morshu) and a link to the beginning of results.
The purpose of this is to prevent people from unintentionally seeing the results, as Discord loads the latest 50 messages in a channel when you open it and more than 50 messages are unread.
Without a spoiler wall, unsuspecting latecomers would be dropped into the middle of results.

#### CLI
Examples:
- `start` would start results (ping results, send title slide)
- `12` would show the response in rank 12
- `1 4 6` would show the responses in ranks 1, 4, and 6
- `5-8 3` would show the responses in ranks 5 through 8 followed by the response in rank 3
- `22; This response did well` would show the response in rank 22 with the comment "This response did well"
- `5.1` would show the first unranked response after rank 5
- `1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
- `end` would end results (send leaderboard(s), send spoiler wall)

### New Rounds
New rounds are stored in `queue.json` in the TWOW folder.
When a new round is created, woooobot will copy over the `contestants.json` and `roundConfig.json` from the previous round with some modifications.
It will then take the first round in `queue.json` and copy over its properties to the new `roundConfig.json`.
Thus, to override properties in `roundConfig.json`, add them to the first element of `queue.json` in the TWOW folder.

In each round of `queue.json`, there is also a special `remove` property, which is either a single key or a list of keys.
All keys in `remove` as well as `remove` itself will be removed from the new `roundConfig.json`.

After doing `phase newRound`, it is recommended to end woooobot (`Ctrl+C`) and restart it to ensure that the new round is loaded properly.