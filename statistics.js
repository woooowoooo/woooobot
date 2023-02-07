const {twowPath} = require("./config.json");
const {seasonPath} = require(twowPath + "status.json");
const {rounds} = require(seasonPath + "seasonConfig.json");
function listPrompts() {
	for (let roundPath of Object.values(rounds)) {
		const {prompt} = require(seasonPath + roundPath + "roundConfig.json");
		console.log(prompt);
	}
}
