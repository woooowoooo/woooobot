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

# Annoyances
- Replace `new.json` with `queue.json`
- Remove `pnpm.lock`, `node_modules`, and other symlinks from unison
- Change "could not require" messages to be opt-in, i.e. show "required" messages instead
- Change default new round name to increment any number found in the previous round's name
- Add a way to use `send` with a username
- Clarify vote rejection messages
	- On partially bad votes, accept the good screens
- Check book attachment extension before saving
- Save large .txt megascreens
- [Add book message to first response message](behavior.md#first-response-message)
- Add points to supervoters who did not respond
- Return reply to `stat` command
- Remove notification roles if people remove the corresponding ping role
- Give actual names to `stat` command stuff
- [Add function that splits command text into arguments](behavior.md#function-that-splits-text-into-arguments)

# EndlessTWOW-specific things
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

## Results
- "Watching SampleTWOW Season 1 Round 1 Results" feature
- Send ping with `start`

## 1b1s
- Generate input

## Statistics
- NR, SR
- Participants per round
	- Number of participants in a round
- Score and points earned per round
- How ranks change over time in a round
- All of someone's placements
- Everyone's ranks throughout the season

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