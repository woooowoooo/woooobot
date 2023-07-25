# Round structure
Each round consists of two phases: responding and voting.
The responding phase is where contestants submit their responses.
The voting phase is where contestants vote on the responses.
Results happen after the voting phase concludes.
After results, the next round begins.

There is a special phase called "both" that allows for simultaneous responding and voting.
The only use case of this I can think of is for a TWOW similar to PerpetualTWOW.

If `autoDeadlines` in `seasonConfig.json` is set to true, these phases will be incremented automatically, following the `rDeadline` and `vDeadline` set in `roundConfig.json`.
`rDeadline` and `vDeadline` are automatically generated following the configured `deadlines` in `seasonConfig.json`, but can be manually configured.

## Responding
When the responding phase begins, the bot will post the prompt in the prompts channel.
If the prompt has a specified author in `roundConfig.json`, the bot will post that field verbatim.
Therefore, if you want to ping the author, set `author` in `roundConfig.json` to `<@SNOWFLAKE>` where `SNOWFLAKE` is replaced with the author's Discord snowflake.
If there is an example response, it will be posted as well.
If there are technicals and/or twists, their titles and descriptions will be posted as well.

### Technicals
A "technical" is a rule that must be followed when responding to a prompt.
Responses that do not follow the technical are not recorded.
By default, a ten word limit technical is imposed on responses.
To cancel this behavior, add `noTenWord` to the list of technicals to be used in `roundConfig.json`.
All technicals that are not the ten word limit inherent in the definition of TWOW must be defined in `technicals.js` in the season folder.
An example `technicals.js` can be found [in the sample season](../Sample%20TWOW/Sample%20Season/technicals.js).

### Twists
A "twist" in the context of woooobot is defined as a function that modifies a response when it is recorded.
Note that woooobot uses a narrow definition of twist.
All twists must be defined in `twists.js` in the season folder.
An example `twists.js` can be found [in the sample season](../Sample%20TWOW/Sample%20Season/twists.js).

## Voting
When the voting phase begins, the bot will send all voting screens as separate images to the voting channel.
If `megascreen` is enabled, a screen that contains every response in the round will be made.
A text version of the megascreen will be also be sent to facilitate use of https://voter.figgyc.uk/.

## Results
### Starting results
When results begins, first the title slide and leaderboard will be created.
Start results by either sending `start` or `resume [slideNumber] [resultsBeginningId]` to woooobot.
This will activate the main results CLI.
If `start` was sent, woooobot will then send a ping and the title slide to the results channel.

### Results CLI
Input should either be a keyword (`lb`, `sw`, `end`) or a list of response ranks, separated by spaces.

If a list of response ranks is sent, woooobot will send a slide containing those responses.
Specify unranked responses (dummies, DRPs) as the rank of the nearest ranked response above it followed by how many (unranked) responses are between them.

Ranges of response ranks can be specified using `-` (e.g. `1-3`).
To exclude unranked responses from a range, add `f` after the range (e.g. `1-3f`).

To add a comment to the slide, separate the comment from the response rank with `;`.

#### Keywords
If `lb` is sent, the bot will post the full leaderboard (generated at the beginning) in the results channel, as well as in the leaderboard channel if a `leaderboards` channel id is defined in `twowConfig.json`.

Finish results by sending either `sw` or `end` to woooobot.

`end` is functionally equivalent to sending `lb` and then `sw`.

### Ending results
When ending results, woooobot will post a 50 message "spoiler wall" in the results channel, consisting of 49 ["morshu sentences"](../README.md#morshu) and a link to the beginning of results.
The purpose of this is to prevent people from unintentionally seeing the results, as Discord loads the latest 50 messages in a channel when you open it and more than 50 messages are unread.
Without a spoiler wall, unsuspecting latecomers would be dropped into the middle of results.

### CLI examples
- `start` would start results (ping results, send title slide)
- `resume 16 1133182838473244742` would resume results with slide numbering starting at 16 with the link at the end of results linking to the message with the Discord snowflake of 1133182838473244742
- `12` would show the response in rank 12
- `1 4 6` would show the responses in ranks 1, 4, and 6
- `5-8 3` would show the responses in ranks 5 through 8 followed by the response in rank 3
- `22; This response did well` would show the response in rank 22 with the comment "This response did well"
- `5.1` would show the first unranked response after rank 5
- `1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
- `lb` would send the leaderboard(s)
- `sw` would end results and send the spoiler wall
- `end` would do both `lb` and `sw`

## New rounds
New rounds are stored in `queue.json` in the TWOW folder.
When a new round is created, woooobot will copy over the `contestants.json` and `roundConfig.json` from the previous round with some modifications.
It will then take the first round in `queue.json` and copy over its properties to the new `roundConfig.json`.
Thus, to override properties in `roundConfig.json`, add them to the first element of `queue.json` in the TWOW folder.

In each round of `queue.json`, there is also a special `remove` property, which is either a single key or a list of keys.
All keys in `remove` as well as `remove` itself will be removed from the new `roundConfig.json`.

After doing `phase newRound`, it is recommended to end woooobot (`Ctrl+C`) and restart it to ensure that the new round is loaded properly.