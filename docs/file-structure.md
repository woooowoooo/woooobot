# TWOW Directory Structure
TWOWs > Seasons > Rounds

To add TWOWs, edit `config.json`.
See [`sampleConfig.json`](../sampleConfig.json) for an example.

For a list of properties for each config file, see [`config-files.md`](config-files.md).

## (Mini)TWOWs
TWOW names and paths should specified in `config.json`.
An example TWOW can be seen at [`Sample TWOW/`](../Sample%20TWOW).
TWOW folders consist of the following:
- Seasons
- `twowConfig.json`
- `status.json`
- `queue.json`
- `nextSeason.json`

`twowConfig.json` deals with the configuration of the Discord server the miniTWOW will be held in.
*All seasons must be held in this server.*

## Seasons
Season names and paths should be specified in the TWOW's `twowConfig.json`.
To use custom responding (or voting, etc.) for a season, put a `responding.js` (or `voting.js`, etc.) in the season folder.
Season folders consist of the following:
- Rounds
- `books` folder
- `seasonConfig.json`
- `seasonContestants.json`
- `graphics.js`
- (Optional) `responding.js`
- (Optional) `voting.js`
- (Optional) `results.js`
- (Optional) `commands.js`
- (Optional) `inits.js`
- (Optional) `technicals.js`
- (Optional) `twists.js`

## Rounds
Round names and paths should be specified in the season's `seasonConfig.json`.
Round folders consist of the following:
- `results` folder
- `screens` folder
- `roundConfig.json`
- `contestants.json`
- `responses.json`
- `results.json`
- `screens.json`
- `votes.json`