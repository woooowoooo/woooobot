# Bugs
- Fix command aftermath
- Fix first round mess
- Fix listeners
	- Sometimes, listeners are doubled up
	- Messages sent during results
	- Stop the bot from treating results screen inputs as commands
		- Removing the console command listener would be sad
	- Some responses are not being recorded
- Refresh all files after results and after `newRound`
- Fix `parseArgs` dying on escaped quotes

# Annoyances
- Replace `new.json` with `queue.json`
- Remove `pnpm.lock`, `node_modules`, and other symlinks from unison
- Change "could not require" messages to be opt-in, i.e. show "required" messages instead
- Change default new round name to increment any number found in the previous round's name
- Add a way to use `send` with a username
- Clarify vote rejection messages
- Check book attachment extension before saving
- Save large .txt megascreens
- [Add book message to first response message](behavior.md#first-response-message)
- Remove notification roles if people remove the corresponding ping role
- Figure out range of `stat list`
- Allow `phase` to take no argument
- Show `reload` in `list`
- Update to new username system

# EndlessTWOW-specific things
- Add points to supervoters who did not respond
- Automatic point assigning before results
	- Fix point assignment afterwards
		- Make it stay even if someone responds after results
- LCH in results
- Make graphics not look funky after 10,000 points
- Re-implement dummies
- Implement editing responses [(see behavior.md)](behavior.md#editing-behavior)
- Implement balance

# New Things
- Multiple TWOWs
- Autoremind
- Settings on Discord itself
- VoteLink™
- Automatic asking for vote justification
- Online vote checker tool
- Dry run of a command
- Slash commands (maybe)
- Use a database (maybe)
- `respond` command (similar to `vote`)
- Make `change` usable and useful
- Command to return a value (like `change` but without changing anything)

## Results
- "Watching SampleTWOW Season 1 Round 1 Results" feature
- Send ping with `start`

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
- Colored logs
- Pause queue recording
	- Partially solved by changing the hotkey to Ctrl + R instead of R
	- Functional Ctrl+C
- Allow CLI arguments to take multiple words
	- Quotes? Will have to cook the arguments
	- Imagine like a proper shell with options and stuff