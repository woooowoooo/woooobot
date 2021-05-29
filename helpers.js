const fs = require("fs");
const {logging} = require("./config.json");
let logStream;
if (logging != null) {
	const time = new Date();
	const path = `${logging}/${time.toISOString().substring(0, 7)}`;
	fs.promises.mkdir(path, {recursive: true}).then(() => {
		logStream = fs.createWriteStream(`${path}/${getTime(time).replace(/\s/g, "-")}.log`, {flags: "ax"});
	});
}
function getTime(time = new Date()) {
	return time.toISOString().substring(0, 10) + ' ' + time.toISOString().substring(11, 19);
};
exports.getTime = getTime;
function logMessage(message, error = false) {
	const time = getTime();
	if (error) {
		console.error(`${time} ${message}`);
	} else {
		console.log(`${time} ${message}`);
	}
	if (logging != null) {
		logStream.write(`${time} ${message}\n`);
	}
};
exports.logMessage = logMessage;