# Bugs
- Fix command aftermath
- Fix first round mess
- Fix listeners
	- Sometimes, listeners are doubled up
	- Messages sent during results
	- Stop the bot from treating results screen inputs as commands
		- Removing the console command listener would be sad
- Use a library for the graphics progress bars

# Annoyances
- Fix queue ordering being wonky
- Replace `new.json` with `queue.json`
- Remove `pnpm.lock`, `node_modules`, and other symlinks from unison
- Change "could not require" messages to be opt-in, i.e. show "required" messages instead
- Change default new round name to increment any number found in the previous round's name
- Make graphics not look funky after 10,000 points
- Add a way to use `send` with a username

## Editing
Your response, `apsdijf` has been recorded.
It is your **2nd** and this round's **13th** submitted response.
You may send **0** more responses.
Send `wb edit 2 [edited response]` to edit this response.

### Allow contestants to edit their name

# EndlessTWOW-specific things
- Automatic point assigning before results
- LCH in results

# New Things
- Multiple TWOWs
- Autoremind
- Settings on Discord itself
- VoteLink™
- Automatic asking for vote justification

## 1b1s
- Generate input

## Statistics
- NR, SR
- Participants per round
- Voters per round
	- VPR of a round
- Score and points earned per round
- How ranks change over time in a round
- All of someone's placements

## TUI
![Concept](concept-tui.png)

- More ways to process messages
	- Send message to message author feature
	- Inbox channel
		- How would choosing whether to process a message work with an inbox though?
- Colored logs
- Pause queue recording
	- Partially solved by changing the hotkey to Ctrl + R instead of R