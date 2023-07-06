# Bugs
- Fix first round mess
- Keep a way to do commands during results, stats are important
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
- Re-implement dummies
	- Implement editing responses with multi-response eligiblity [(see behavior.md)](behavior.md#editing-behavior)
- Implement balance
- Implement items
- 1b1s
- Opening cards
- `results` command? stat?

# New Things
- Multiple TWOWs
- Autoremind
	- Pawn off to a separate bot or library
- Settings on Discord itself
- Dry run of a command
- Slash commands (maybe)
- Use a database (maybe)

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
- Open results image setting
- Let people generate screens
- Don't save individual screens save for the leaderboard maybe
- Compact header (Round number on left, prompt on right) maybe

## 1b1s
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