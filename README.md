# woooobot
Made to automate twoooowoooo.

## Commands
Example table entry:
| Command | Description |
| --- | --- |
| `command <requiredArg> [optionalArg]` | Description `<argument>`. |

### Unrestricted
| Command | Description |
| --- | --- |
| `help` | Show a welcome message. |
| `list` | Show this command list. |
| `book` (attach exactly one file) | Record the attachment as your book. |
| `echo <message>` | Repeats `<message>`. |
| `morshu [wordCount]` | Generates `<wordCount>` amount of morshu words. Default amount is 10 words. |
| `ping [userId]` | Ping `<userId>` if provided. Pings yourself otherwise. |

### Admin-only
| Command | Description |
| --- | --- |
| `phase [newPhase]` | Changes round status to `<newPhase>`. If no argument is provided, increments the phase. |

### Developer-only
| Command | Description |
| --- | --- |
| `change <path> <key> <value>` | Changes the value of `<key>` in `<path>` to `<value>`. |
| `edit <messageId> <channelId> <newMessage>` | Edits the message `<messageId>` (in `<channelId>`) to `<newMessage>`. |
| `eval <command>` | Runs `<command>`. |
| `reload` | Reloads commands.js. |
| `send <id> <text>` | Sends `<text>` to `<id>`. |

## TWOW Directory Structure
TWOWs > Seasons > Rounds

To add TWOWs, edit [config.json]. See `sampleConfig.json` for an example.

`config.json` properties:

| Key | Value Type | Description |
| --- | --- | --- |
| `version` | Integer | `config.json` version |
| `sandbox` | Boolean | Send all messages to a sandbox channel |
| `logging` | Boolean | Save logs |
| `automatic` | Boolean | Automatically process messages |
| `prefix` | String | Prefix to activate commands |
| `token` | String | Discord bot token (NEVER SHARE THIS) |
| `devId` | Snowflake | Me! |
| `botId` | Snowflake | This bot's id |
| `sandboxId` | Snowflake | Channel to send messages to if `sandbox` is true |
| `lastUnread` | Snowflake | Messages with later snowflakes count as unread |
| `loggingPath` | String | Where log files save to if `logging` is true |
| `twows` | {String: String} | TWOW names and paths |
| `currentTWOW` | String | Name of the TWOW this bot should check |
| `twowPath` | String | The path of `currentTWOW` |

### TWOWs
An example TWOW can be seen at [Sample TWOW](Sample%20TWOW).
TWOW names and paths should specified in `config.json`.
(Mini)TWOWs consist of the following:
- Seasons
- `twowConfig.json`
- `status.json`
- `new.json`

`twowConfig.json` properties:

| Key | Value Type | Description |
| --- | --- | --- |
| `version` | Integer | `twowConfig.json` version |
| `name` | String | TWOW name |
| `id` | Snowflake | TWOW server id |
| `roles` | {String: Snowflake} | Role names and ids |
| `channels` | {String: Snowflake} | Channel names and ids |
| `seasons` | {String: String} | Season names and paths |

Roles include `admin`, `mod`, `bot`, `prize`, `supervoter`, `alive`, `dead`, and `noRemind`. All are required.

Channels include `bots` (an array of bot channels), `prompts`, `voting`, `results`, `reminders`, and `statistics`. All are required.

### Seasons
Season names and paths should be specified in the TWOW's `twowConfig.json`.
If one wishes to use custom responding, voting, or results, one may specify the path to the custom code in `seasonConfig.json`.
Seasons consist of the following:
- Rounds
- `books` folder
- `seasonConfig.json`
- `seasonContestants.json`
- `graphics.js`
- (Optional) `technicals.js`
- (Optional) `twists.js`

`seasonConfig.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | Integer | `seasonConfig.json` version |
| `season` | String | Season name |
| `respondingPath` | String | (Optional) Path for custom `responding.js` |
| `votingPath` | String | (Optional) Path for custom `voting.js` |
| `resultsPath` | String | (Optional) Path for custom `results.js` |
| `autoDeadlines` | Boolean | Enable automatic phase changes after deadlines |
| `deadlines` | \[Integer\] | Length of responding and voting phase in days |
| `reminders` | {String: Integer} | Reminder names and times to deadline in hours |
| `dummies` | Boolean | Allow dummy/filler responses |
| `sections` | Integer | Number of sections in voting, not including a megascreen |
| `megascreen` | Boolean | Create a megascreen, a screen with every response, during voting |
| `autoKeywords` | Boolean | Generate keywords for screens automatically |
| `cutoffs` | {String: Float} | Results cutoff types and percentiles |
| `rounds` | {String: String} | Round names and paths |

### Rounds
Round names and paths should be specified in the season's `seasonConfig.json`.
Rounds consist of the following:
- `results` folder
- `screens` folder
- `roundConfig.json`
- `contestants.json`
- `responses.json`
- `results.json`
- `screens.json`
- `votes.json`

`roundConfig.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | Integer | `roundConfig.json` version |
| `season` | String | Season name |
| `round` | String | Round name |
| `prompt` | String | Round prompt |
| `example` | String | (Optional) Example response to the prompt |
| `rDeadline` | String | Responding deadline in the format `YYYY-MM-DD HH:MM:SS` (UTC) |
| `vDeadline` | String | Voting deadline in the format `YYYY-MM-DD HH:MM:SS` (UTC) |
| `technicals` | \[String\] | (Optional) List of technicals (defined in `technicals.js` in the season folder) to follow |
| `twists` | \[String\] | (Optional) List of twists (defined in `twists.js` in the season folder) that will be applied to responses |
| `sections` | Integer | (Optional) Overrides the value specified in `seasonConfig.json` |
| `megascreen` | Boolean | (Optional) Overrides the value specified in `seasonConfig.json` |

## Round structure
Each round consists of two phases: responding and voting. Results happen after the voting phase concludes.

### Results CLI
Examples:
- `1 4 6` would show the responses in ranks 1, 4, and 6
- `5.1` would show the first unranked response after rank 5
- `1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
- `end` would end results