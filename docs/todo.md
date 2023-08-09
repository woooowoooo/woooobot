# Bugs
- Fix first round mess
- Keep a way to do commands during results, stats are important
- Fix `parseArgs` in general
- Reject book attachments of unsupported file types

# Annoyances
- Remove `pnpm.lock`, `node_modules`, and other symlinks from unison
- Change "could not require" messages to be opt-in, i.e. show "required" messages instead
- Change default new round name to increment any number found in the previous round's name
- Add a way to use `send` with a username
- Add a way to use `send` with a channel name
- [Add book message to first response message](behavior.md#first-response-message)
- Remove notification roles if people remove the corresponding ping role
- Figure out range of `stat list`
- Allow `phase` to take no argument
- Add `open` functionality to Windows
- Add sample custom commands

# EndlessTWOW-specific Things
- Add points to supervoters who did not respond
- Add pointless voting? Ability to remove points?
- Automatic point assigning before results
	- Fix point assignment afterwards
		- Make it stay even if someone responds after results
- LCH in results
- Re-implement dummies
	- Implement editing responses with multi-response eligiblity [(see behavior.md)](behavior.md#editing-behavior)
- Implement balance
- Implement items

# ACN Season 20 Part 5
- Serverless TWOW??
- Send to clipboard?
- Confirm TWOW works with combined twow and season file

# New Things
- Save incoming attachments
- Multiple TWOWs
- Autoremind
	- Pawn off to a separate bot or library
- Settings on Discord itself
- Use a database (maybe)
- Move to ES modules (maybe)
- Single-use properties in queue

## Commands
- Dry run of a command
- Slash commands (maybe)
- Commands with options (maybe)
	- Parameters
- Make `change` useful
- Argument of `log` to open it in a text viewer

## Voting
- VoteLink™
	- URL is too long to fit in a button
- Automatic asking for vote justification
- Online vote checker tool

## Results
- Let people generate screens
- Compact header (Round number on left, prompt on right) maybe
- `results` command? stat?
- Generate 1b1s
- Open-ended ranges

## Statistics
- Document stats
- Custom stats
- Leaderboard change over votes in a round
- Allow non-current-season rounds to be specified
- Break seasons into all rounds for round-specific stats (requires non-current-season rounds)
- Image output
- Open-ended ranges

### Individual
- Default contestant argument
- NR, SR
- Score and points earned per round
- Placements in each round

## TUI
- Using `blessed` maybe?
	- `reblessed` looks like `blessed` but not dead! Only took an hour to find it
- Use a library for the graphics progress bars
	- Progress bar for queue processing and mass role assignment/removal
- More ways to process messages
	- Send message to message author feature
	- Inbox channel
		- How would choosing whether to process a message work with an inbox though?
- Pause queue recording
	- Partially solved by changing the hotkey to Ctrl + R instead of R
	- Functional Ctrl+C
- Quotes in CLI (will have to cook the arguments)
- Imagine like a proper shell with options
- Command history (up/down arrows)
- Command autocomplete maybe