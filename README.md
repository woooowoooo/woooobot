# woooobot
Made to automate twoooowoooo. Currently used to automate EndlessTWOW.

**DOCS LAST UPDATED ON 2023-06-15**

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
<!-- | `edit [responseNumber] <message>` | Edits your response. You must specify a `<responseNumber>` if you have submitted multiple responses. | -->
| `edit <newResponse>` | Edits your response to `<newResponse>`. |
| `morshu [sentenceCount]` | Generates `<sentenceCount>` (one if unspecified) amount of [morshu sentences](#spoiler-wall). |
| `name <newName>` | Changes the name displayed during results for the current season to `<newName>`. |
| `ping` | Pings yourself. |
| `stat <statName> [possible arguments]` | It's complicated (docs don't exist yet) |

### Admin-only
| Command | Description |
| --- | --- |
| `phase <phase>` | Changes round status to `<phase>`. |
| `respond <userId> <messageId> <response>` | Records `<response>` as `<userId>`'s response, sent as message `<messageId>`. `<messageId>` may be in the form of a ISO 8601 time string. |
| `vote <userId> <messageId> <vote>` | Records `<vote>` as `<userId>`'s vote, sent as message `<messageId>`. `<messageId>` may be in the form of a ISO 8601 time string. |

### Developer-only
| Command | Description |
| --- | --- |
| `change <path> <key> <value>` | Changes the value of `<key>` in `<path>` to `<value>`. |
| `editmsg <channelId> <messageId> <newMessage>` | Edits the message `<messageId>` (in `<channelId>`) to `<newMessage>`. |
| `eval <code>` | Runs `<code>`. |
| `log [date]` | Returns the log file for `<date>` (today if unspecified). |
| `reload` | Reloads commands.js. |
| `send <channelId> <message>` | Sends `<message>` to `<channelId>`. |

## TWOW Directory Structure
TWOWs > Seasons > Rounds

To add TWOWs, edit `config.json`.
See [sampleConfig.json] for an example.
For the tables below, **a bold asterisk means the property is required**.

`config.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | Integer | `config.json` version |
| **\***`sandbox` | Boolean | Send all messages to a sandbox channel |
| **\***`logging` | Boolean | Save logs |
| **\***`colorLogs` | Boolean | Use ANSI color codes in logs |
| **\***`automatic` | Boolean | Automatically process messages |
| **\***`prefix` | String | Prefix to activate commands |
| **\***`token` | String | Discord bot token (NEVER SHARE THIS) |
| **\***`devId` | Snowflake | Me! |
| **\***`botId` | Snowflake | This bot's id |
| `sandboxId` | Snowflake | **REQUIRED IF USING SANDBOX** Channel to send messages to if `sandbox` is true |
| **\***`lastUnread` | Snowflake | Messages with later snowflakes count as unread |
| `loggingPath` | String | **REQUIRED IF LOGGING** Where log files save to if `logging` is true |
| **\***`twows` | {String: String} | TWOW names and paths |
| **\***`currentTWOW` | String | Name of the TWOW this bot should check |
| **\***`twowPath` | String | The path of `currentTWOW` |

### (Mini)TWOWs
TWOW names and paths should specified in `config.json`.
An example TWOW can be seen at [Sample TWOW](Sample%20TWOW).
TWOW folders consist of the following:
- Seasons
- `twowConfig.json`
- `status.json`
- `queue.json`
- `nextSeason.json`

`twowConfig.json` deals with the configuration of the Discord server the miniTWOW will be held in.
ALL SEASONS MUST BE HELD IN THIS SERVER.

`twowConfig.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | Integer | `twowConfig.json` version |
| **\***`name` | String | TWOW name |
| **\***`id` | Snowflake | TWOW server id |
| **\***`roles` | {String: Snowflake} | Role names and ids |
| **\***`channels` | {String: Snowflake} | Channel names and ids |
| **\***`seasons` | {String: String} | Season names and paths |

Roles include `admin`, `mod`, `bot`, `prize`, `supervoter`, `alive`, `dead`, and `noRemind`. All are required.

Channels include `bots` (an array of bot channels), `prompts`, `voting`, `results`, `reminders`, and `statistics`. All are required.

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
- (Optional) `inits.js`
- (Optional) `technicals.js`
- (Optional) `twists.js`

`seasonConfig.json` properties:
| Key | Value Type | Description |
| --- | --- | --- |
| `version` | Integer | `seasonConfig.json` version |
| `season` | String | Season name |
| **\***`autoDeadlines` | Boolean | Enable automatic phase changes after deadlines |
| **\***`deadlines` | \[Integer\] | Length of responding and voting phase in days |
| **\***`reminders` | {String: Integer} | Reminder names and times to deadline in hours |
| **\***`dummies` | Boolean | Allow dummy/filler responses |
| **\***`sections` | Integer | Number of sections in voting, not including a megascreen |
| **\***`megascreen` | Boolean | Create a megascreen, a screen with every response, during voting |
| **\***`autoKeywords` | Boolean | Generate keywords for screens automatically |
| **\***`cutoffs` | {String: Float} | Results cutoff types and percentiles |
| **\***`rounds` | {String: String} | Round names and paths |

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
| `version` | Integer | `roundConfig.json` version |
| `season` | String | Season name |
| `round` | String | Round name |
| **\***`prompt` | String | Round prompt |
| `author` | String | Author of the prompt |
| `example` | String | Example response to the prompt |
| **\***`rDeadline` | String | Responding deadline in the format `YYYY-MM-DD HH:MM:SS` (UTC) |
| **\***`vDeadline` | String | Voting deadline in the format `YYYY-MM-DD HH:MM:SS` (UTC) |
| `technicals` | \[String\] | List of technicals (defined in `technicals.js` in the season folder) to follow |
| `twists` | \[String\] | List of twists (defined in `twists.js` in the season folder) that will be applied to responses |
| `sections` | Integer | Overrides the value specified in `seasonConfig.json` |
| `megascreen` | Boolean | Overrides the value specified in `seasonConfig.json` |

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
Therefore, tf you want to ping the author, set `author` in `roundConfig.json` to `<@SNOWFLAKE>` where `SNOWFLAKE` is replaced with the author's Discord snowflake.
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
When results begins, first the leaderboard will be created.
Then, the results CLI will activate.
After results are finished with `end`, the bot will post the full leaderboard (generated at the beginning) in the results channel, as well as in the leaderboard channel if a `leaderboards` channel id is defined in `twowConfig.json`.
It will then post a 49 message ["spoiler wall" of "morshu sentences"](#spoiler-wall) in the results channel to prevent people from unintentionally seeing the results.
Finally, it will post a link to the beginning of results.

#### CLI
Examples:
- `1 4 6` would show the responses in ranks 1, 4, and 6
- `5.1` would show the first unranked response after rank 5
- `1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
- `end` would end results

#### Spoiler Wall
Morshu sentences are grammatical (mostly) English sentences that only contain words spoken by Morshu in the CD-i game "Link: The Faces of Evil".
They are generated in [`morshu.js`](morshu.js).
If you run `node morshu.js`, it will generate ten morshu sentences.

### New Rounds
New rounds are stored in `queue.json` in the TWOW folder.
When a new round is created, woooobot will copy over the `contestants.json` and `roundConfig.json` from the previous round with some modifications.
To override properties in `roundConfig.json`, add them to `queue.json` in the TWOW folder.
In each round of `queue.json`, there is also a special `remove` property, which is either a single key or a list of keys.
All keys in `remove` as well as `remove` itself will be removed from the new `roundConfig.json`.
After doing `phase newRound`, it is recommended to end woooobot (`Ctrl+C`) and restart it to ensure that the new round is loaded properly.