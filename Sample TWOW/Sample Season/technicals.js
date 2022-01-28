const technicals = {
	tenWord: {
		title: "Ten Words of Wisdom",
		description: "Responses must contain at most ten words, where a word is anything delimited by a whitespace character.",
		check: function (response) {
			let wordCount = response.split(/\s/).filter(word => {
				word.match(/\w/); // Don't count punctuation-only "words"
			}).length;
			return wordCount <= 10;
		}
	},
	noTenWord: {
		title: "No Ten Word Limit",
		description: "Responses are freed from the ten word limit of the original TWOW.",
		check: function () {
			return true; // The freeing is done in responding.js
		}
	},
	concise: {
		title: "Conciseness Is Key",
		description: "Responses must be at most 80 characters long.",
		check: function (response, max = 80) {
			return response.length <= max;
		}
	},
	rng: {
		title: "Flip a Coin",
		description: "Everything depends on the whims of `Math.random()`.",
		check: function () {
			return Math.random() >= 0.5;
		}
	},
	rule2: {
		title: "Anti-meme",
		description: "Responses must have over seven words.",
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
		title: "Lipogram",
		description: "Responses must not have certain letters.",
		check: function (response, letters = ["b"]) {
			response = response.toLowerCase();
			for (const letter in letters) {
				if (response.includes(letter)) {
					return false;
				}
			}
			return true;
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
		check: function (response, min = 3) {
			response = response.toLowerCase();
			let firsts = response.split(" ").map(word => word[0]);
			let freqs = firsts.reduce((freqs, letter) => {
				freqs[letter] = (freqs[letter] ?? 0) + 1;
				return freqs;
			}, {});
			return Object.values(freqs).sort((a, b) => b - a)[0] >= min;
		}
	},
	rule7: {
		title: "Diverse Word Lengths",
		description: "All word lengths are equal, but some word lengths are more equal than others.",
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
		check: function (response, max = 8) {
			response = response.toLowerCase();
			let letters = response.match(/[a-z]/g) ?? [];
			let freqs = letters.reduce((freqs, letter) => {
				freqs[letter] = (freqs[letter] ?? 0) + 1;
				return freqs;
			}, {});
			return Object.values(freqs).sort((a, b) => b - a)[0] < max;
		}
	}
};
module.exports = technicals;