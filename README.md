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

An example can be seen at [Sample TWOW](./Sample%20TWOW).

### TWOWs
(Mini)TWOWs consist of the following:
- Seasons
- `twowConfig.json`
- `status.json`

TWOW names and paths should specified in `config.json`. See `sampleConfig.json` for an example.

### Seasons
Seasons consist of the following at a minimum:
- Rounds
- `books` folder
- `seasonConfig.json`
- `seasonContestants.json`
- `graphics.js`

If one wants a season with custom technicals, twists, responding, voting, or results, one can specify that in this folder level. Season names and paths should be specified in the TWOW's `twowConfig.json`.

### Rounds
Rounds consist of the following:
- `results` folder
- `screens` folder
- `roundConfig.json`
- `contestants.json`
- `responses.json`
- `results.json`
- `screens.json`
- `votes.json`

Round names and paths should be specified in the season's `seasonConfig.json`.

## Round structure
Each round consists of two phases: responding and voting. Results happen after the voting phase concludes.

### Results CLI
Examples:
- `1 4 6` would show the responses in ranks 1, 4, and 6
- `5.1` would show the first unranked response after rank 5
- `1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
- `end` would end results