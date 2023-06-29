# Editing behavior
| | Doesn't submit number | Submits number |
| --- | --- | --- |
| Submits 1 response, ineligible for multiple | :) | Treat number as part of response? Remove number? |
| Submits 1 response, eligible for multiple | ??? | ??? |
| Submits multiple responses | Error | :) |

# Recording message
Your response, `apsdijf` has been recorded.
It is your **2nd** and this round's **13th** submitted response.
You may send **0** more responses.
Send `wb edit 2 [edited response]` to edit this response.

# First response message
(EndlessTWOW) As this is your first response, you have automatically been added three ping roles. You may remove them at <#813619463446331443>.

# TUI
![Concept](concept-tui.png)

# Stats
- Store stats someplace?
- Specify whether stats apply to rounds, seasons, or twows and for individuals or everyone
- There could be like a complex system for specifying what stat over what rounds or seasons or whatnot to show
- Have a keyword to get the length of a list, maybe `length` or `size`
- Pipe stats into other stats? What would that even mean? It'd probably use `|`
	- Maybe pipe them into some processing functions, like that length thing

## Stat ranges
- Seasons would break into all rounds for round-specific stats for example
- For stats with both range and contestants, the round range would be first
- If no contestant is specified, it would default to the user
	- Maybe a keyword to specify all contestants?

Example: `wb stat listContestants "Round 156"-"Round 160"`