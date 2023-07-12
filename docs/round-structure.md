# Round structure
Each round consists of two phases: responding and voting.
There is a special phase called "both" that allows for simultaneous responding and voting.
Results happen after the voting phase concludes.
After results, the next round begins.
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
When results begins, first the title slide and leaderboard will be created.
Start results by sending `start`.
This will activate the results CLI and send a ping to the results channel.
After results are finished by sending `end`, the bot will post the full leaderboard (generated at the beginning) in the results channel, as well as in the leaderboard channel if a `leaderboards` channel id is defined in `twowConfig.json`.

It will then post a 50 message "spoiler wall" in the results channel, consisting of 49 ["morshu sentences"](../README.md#morshu) and a link to the beginning of results.
The purpose of this is to prevent people from unintentionally seeing the results, as Discord loads the latest 50 messages in a channel when you open it and more than 50 messages are unread.
Without a spoiler wall, unsuspecting latecomers would be dropped into the middle of results.

### CLI
Examples:
- `start` would start results (ping results, send title slide)
- `12` would show the response in rank 12
- `1 4 6` would show the responses in ranks 1, 4, and 6
- `5-8 3` would show the responses in ranks 5 through 8 followed by the response in rank 3
- `22; This response did well` would show the response in rank 22 with the comment "This response did well"
- `5.1` would show the first unranked response after rank 5
- `1-3f` would show the responses in ranks 1 through 3 without dummies and DRPs
- `end` would end results (send leaderboard(s), send spoiler wall)

## New Rounds
New rounds are stored in `queue.json` in the TWOW folder.
When a new round is created, woooobot will copy over the `contestants.json` and `roundConfig.json` from the previous round with some modifications.
It will then take the first round in `queue.json` and copy over its properties to the new `roundConfig.json`.
Thus, to override properties in `roundConfig.json`, add them to the first element of `queue.json` in the TWOW folder.

In each round of `queue.json`, there is also a special `remove` property, which is either a single key or a list of keys.
All keys in `remove` as well as `remove` itself will be removed from the new `roundConfig.json`.

After doing `phase newRound`, it is recommended to end woooobot (`Ctrl+C`) and restart it to ensure that the new round is loaded properly.