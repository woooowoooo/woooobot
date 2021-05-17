module.exports = {
	tenWord: {
		title: "TWOW",
		description: "Responses must contain at most ten words, where a word is anything delimited by a whitespace character.",
		check: function (response) {
			let wordCount = response.split(" ").length;
			return wordCount <= 10;
		}
	},
	concise: {
		title: "Conciseness is key",
		description: "Responses must be at most 80 characters long.",
		check: function (response) {
			return response.length <= 80;
		}
	},
	rng: {
		title: "Flip a coin",
		description: "Response acceptance depends on the whims of `Math.random()`.",
		check: function () {
			return Math.random() >= 0.5;
		}
	},
	rule2: {
		title: "Rule 2",
		description: "Rule 2 of CarnivalTWOW R12.",
		check: function (response) {
			let wordCount = response.split(" ").length;
			return wordCount >= 7;
		}
	},
	rule3: {
		title: "Rule 3",
		description: "Rule 3 of CarnivalTWOW R12.",
		check: function (response) {
			return response.length <= 80 && response.length >= 40;
		}
	},
	rule4: {
		title: "Rule 4",
		description: "Rule 4 of CarnivalTWOW R12.",
		check: function (response) {
			response = response.toLowerCase();
			return !response.includes("b");
		}
	},
	rule5: {
		title: "Rule 5",
		description: "Rule 5 of CarnivalTWOW R12.",
		check: function (response) {
			return response.match(/([a-z])\1/i);
		}
	},
	rule6: {
		title: "Rule 6",
		description: "Rule 6 of CarnivalTWOW R12.",
		check: function (response) {
			response = response.toLowerCase();
			let firsts = response.split(" ").map(word => word[0]);
			let freqs = firsts.reduce((freqs, letter) => {
				freqs[letter] = (freqs[letter] ?? 0) + 1;
				return freqs;
			}, {});
			return Object.values(freqs).sort((a, b) => b - a)[0] >= 3;
		}
	},
	rule7: {
		title: "Rule 7",
		description: "Rule 7 of CarnivalTWOW R12.",
		check: function (response) {
			let lengths = response.split(" ").map(word => word.replace(/[^\w\s]/g, "").length);
			for (let i = 1; i < lengths.length; i++) {
				if (lengths[i] === lengths[i - 1]) {
					return false;
				}
			}
			return true;
		}
	},
	rule8: {
		title: "Rule 8",
		description: "Rule 8 of CarnivalTWOW R12.",
		check: function (response) {
			response = response.toLowerCase();
			let letters = response.match(/[a-z]/g) ?? [];
			let freqs = letters.reduce((freqs, letter) => {
				freqs[letter] = (freqs[letter] ?? 0) + 1;
				return freqs;
			}, {});
			return Object.values(freqs).sort((a, b) => b - a)[0] < 8;
		}
	}
};