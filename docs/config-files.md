# Config File Structures
For the tables below, **a bold asterisk means the property is required**.

## `config.json`
Example: [`sampleConfig.json`](../sampleConfig.json)

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

## `twowConfig.json`
Example: [`Sample TWOW/twowConfig.json`](../Sample%20TWOW/twowConfig.json)

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

## `seasonConfig.json`
Example: [`Sample TWOW/Sample Season/seasonConfig.json`](../Sample%20TWOW/Sample%20Season/seasonConfig.json)

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

## `roundConfig.json`
Example: [`Sample TWOW/Sample Season/Round 1/roundConfig.json`](../Sample%20TWOW/Sample%20Season/Round%201/roundConfig.json)

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