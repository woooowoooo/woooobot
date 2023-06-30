# Bugs
- Fix command aftermath
- Fix first round mess
- Fix listeners
	- Sometimes, listeners are doubled up
	- Queue messages during results but read them afterwards
	- Stop the bot from erroring on result screen inputs
		- Keep a way to do commands during results, stats are important
- Refresh all files after results and after `newRound`
- Fix `parseArgs` dying on escaped quotes

# Annoyances
- Remove `pnpm.lock`, `node_modules`, and other symlinks from unison
- Change "could not require" messages to be opt-in, i.e. show "required" messages instead
- Change default new round name to increment any number found in the previous round's name
- Add a way to use `send` with a username
- Check book attachment extension before saving
- Save large .txt megascreens
- [Add book message to first response message](behavior.md#first-response-message)
- Remove notification roles if people remove the corresponding ping role
- Figure out range of `stat list`
- Allow `phase` to take no argument
- Show `reload` in `list`
- Update to new username system

# EndlessTWOW-specific Things
- Add points to supervoters who did not respond
- Automatic point assigning before results
	- Fix point assignment afterwards
		- Make it stay even if someone responds after results
- LCH in results
- Make graphics not look funky after 10,000 points
- Re-implement dummies
	- Implement editing responses with multi-response eligiblity [(see behavior.md)](behavior.md#editing-behavior)
- Implement balance
- Implement items

# New Things
- Multiple TWOWs
- Autoremind
	- Pawn off to a separate bot or library
- Settings on Discord itself
- Dry run of a command
- Slash commands (maybe)
- Use a database (maybe)
- Open results image setting

## New Commands
- `respond` command (similar to `vote`)
- User-side `respond` and `vote` commands
- Make `change` usable and useful
- Command to return a value (like `change` but without changing anything)
- Argument of `log` to open it in a text viewer

## Voting
- VoteLink™
- Automatic asking for vote justification
- Online vote checker tool

## Results
- "Watching SampleTWOW Season 1 Round 1 Results" feature
- Send ping with `start`

### 1b1s
- Generate input

## Statistics
- Give actual names to stat commands
- Leaderboard change over votes in a round

### Individual
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