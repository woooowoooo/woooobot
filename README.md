# woooobot
Made to automate twoooowoooo.

**DOCS LAST UPDATED ON 2022-07-10**

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

To add TWOWs, edit `config.json`.
See [sampleConfig.json] for an example.
For the tables below, *italicized value types mean the property is optional*.

`config.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | *Integer* | `config.json` version |
| `sandbox` | Boolean | Send all messages to a sandbox channel |
| `logging` | Boolean | Save logs |
| `automatic` | Boolean | Automatically process messages |
| `prefix` | String | Prefix to activate commands |
| `token` | String | Discord bot token (NEVER SHARE THIS) |
| `devId` | Snowflake | Me! |
| `botId` | Snowflake | This bot's id |
| `sandboxId` | *Snowflake* | *REQUIRED IF SANDBOX* Channel to send messages to if `sandbox` is true |
| `lastUnread` | Snowflake | Messages with later snowflakes count as unread |
| `loggingPath` | *String* | *REQUIRED IF LOGGING* Where log files save to if `logging` is true |
| `twows` | {String: String} | TWOW names and paths |
| `currentTWOW` | String | Name of the TWOW this bot should check |
| `twowPath` | String | The path of `currentTWOW` |

### (Mini)TWOWs
TWOW names and paths should specified in `config.json`.
An example TWOW can be seen at [Sample TWOW](Sample%20TWOW).
TWOW folders consist of the following:
- Seasons
- `twowConfig.json`
- `status.json`
- `new.json`

`twowConfig.json` deals with the configuration of the Discord server the miniTWOW will be held in.
ALL SEASONS MUST BE HELD IN THIS SERVER.

`twowConfig.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | *Integer* | `twowConfig.json` version |
| `name` | String | TWOW name |
| `id` | Snowflake | TWOW server id |
| `roles` | {String: Snowflake} | Role names and ids |
| `channels` | {String: Snowflake} | Channel names and ids |
| `seasons` | {String: String} | Season names and paths |

Roles include `admin`, `mod`, `bot`, `prize`, `supervoter`, `alive`, `dead`, and `noRemind`. All are required.

Channels include `bots` (an array of bot channels), `prompts`, `voting`, `results`, `reminders`, and `statistics`. All are required.

### Seasons
Season names and paths should be specified in the TWOW's `twowConfig.json`.
To use custom responding (or voting, results, technicals, or twists) for a season, put a `responding.js` (or `voting.js`, `results.js`, `technicals.js`, or `twists.js`) in the season folder.
Season folders consist of the following:
- Rounds
- `books` folder
- `seasonConfig.json`
- `seasonContestants.json`
- `graphics.js`
- (Optional) `responding.js`
- (Optional) `voting.js`
- (Optional) `results.js`
- (Optional) `technicals.js`
- (Optional) `twists.js`

`seasonConfig.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | *Integer* | `seasonConfig.json` version |
| `season` | *String* | Season name |
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
Round folders consist of the following:
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
| `version` | *Integer* | `roundConfig.json` version |
| `season` | *String* | Season name |
| `round` | *String* | Round name |
| `prompt` | String | Round prompt |
| `example` | *String* | Example response to the prompt |
| `rDeadline` | String | Responding deadline in the format `YYYY-MM-DD HH:MM:SS` (UTC) |
| `vDeadline` | String | Voting deadline in the format `YYYY-MM-DD HH:MM:SS` (UTC) |
| `technicals` | *\[String\]* | List of technicals (defined in `technicals.js` in the season folder) to follow |
| `twists` | *\[String\]* | List of twists (defined in `twists.js` in the season folder) that will be applied to responses |
| `sections` | *Integer* | Overrides the value specified in `seasonConfig.json` |
| `megascreen` | *Boolean* | Overrides the value specified in `seasonConfig.json` |

## Round structure
Each round consists of two phases: responding and voting.
Results happen after the voting phase concludes.
If `autoDeadlines` in `seasonConfig.json` is set to true, these phases will be incremented automatically, following the `rDeadline` and `vDeadline` set in `roundConfig.json`.
`rDeadline` and `vDeadline` are automatically generated following the configured `deadlines` in `seasonConfig.json`, but can be manually configured.

### Responding

#### Technicals
By default, a ten word limit technical is imposed on responses.
To cancel this behavior, add `noTenWord` to the list of technicals to be used in `roundConfig.json`.
All technicals that are not the ten word limit inherent in the definition of TWOW must be defined in `technicals.js` in the season folder.
An example `technicals.js` can be found [in the sample season](Sample%20TWOW/Sample%20Season/technicals.js).

#### Twists
**Currently, twists are slightly broken.**
All twists must be defined in `twists.js` in the season folder.
An example `twists.js` can be found [in the sample season](Sample%20TWOW/Sample%20Season/twists.js).

### Voting

### Results CLI
Examples:
- `1 4 6` would show the responses in ranks 1, 4, and 6
- `5.1` would show the first unranked response after rank 5
- `1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
- `end` would end results