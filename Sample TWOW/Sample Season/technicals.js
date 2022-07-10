const technicals = {
	concise: {
		title: "Concise",
		description: "Responses must be at most 80 characters long.",
		check: function (response, max = 80) {
			return response.length <= max;
		}
	},
	coinFlip: {
		title: "Coin Flip",
		description: "Hope.",
		check: function () {
			return Math.random() >= 0.5;
		}
	},
	antiMeme: {
		title: "Anti-meme",
		description: "Responses must have over seven words.",
		check: function (response) {
			let wordCount = response.split(" ").length;
			return wordCount >= 7;
		}
	},
	lipogram: {
		title: "Lipogram",
		description: "Responses must not have certain letters.",
		check: function (response, letters) {
			response = response.toLowerCase();
			for (const letter in letters) {
				if (response.includes(letter)) {
					return false;
				}
			}
			return true;
		}
	}
};
module.exports = technicals;