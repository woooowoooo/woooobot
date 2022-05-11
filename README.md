# woooobot
Made to automate twoooowoooo.

## Commands
Example table entry:
| Command | Description |
| --- | --- |
| `command <requiredArg> [optionalArg]` | Description `<argument>`. |

UNRESTRICTED:
| Command | Description |
| --- | --- |
| `help` | Show a welcome message. |
| `list` | Show this command list. |
| `book` (attach exactly one file) | Record the attachment as your book. |
| `echo <message>` | Repeats `<message>`. |
| `morshu [wordCount]` | Generates `<wordCount>` amount of morshu words. Default amount is 10 words. |
| `ping [userId]` | Ping `<userId>` if provided. Pings yourself otherwise. |

ADMIN-ONLY:
| Command | Description |
| --- | --- |
| `phase [newPhase]` | Changes round status to `<newPhase>`. If no argument is provided, increments the phase. |

DEVELOPER-ONLY:
| Command | Description |
| --- | --- |
| `change <path> <key> <value>` | Changes the value of `<key>` in `<path>` to `<value>`. |
| `edit <messageId> <channelId> <newMessage>` | Edits the message `<messageId>` (in `<channelId>`) to `<newMessage>`. |
| `eval <command>` | Runs `<command>`. |
| `reload` | Reloads commands.js. |
| `send <id> <text>` | Sends `<text>` to `<id>`. |

## Results CLI
Examples:
`1 4 6` would show the responses in ranks 1, 4, and 6
`5.1` would show the first unranked response after rank 5
`1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
`end` would end results