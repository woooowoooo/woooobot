exports.getTime = function (time = new Date()) {
	return time.toISOString().substring(0, 10) + ' ' + time.toISOString().substring(11, 19);
};