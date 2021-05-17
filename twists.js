module.exports = {
	backwards: {
		title: "sdrawkcaB",
		description: "Your response will be flipped horizontally.",
		execute: function (response) {
			return response.split("").reverse().join(""); // Breaks surrogate pairs but that's unimportant
		}
	}
};