const fs = require("fs").promises;
const readline = require("readline");
const stream = require("stream");
const {createCanvas, loadImage} = require("canvas");
const ffmpeg = require("fluent-ffmpeg");
const FONT_STACK = "px Charter, serif";
const HEADER_HEIGHT = 240;
const ROW_HEIGHT = 120;
const WIDTH = 2400;
function drawHeader(context, title, prompt, width, height) {
	context.fillStyle = "white";
	context.fillRect(0, 0, width, height);
	context.fillStyle = "black";
	context.font = 40 + FONT_STACK;
	context.textAlign = "center";
	// Split the prompt into two lines
	if (context.measureText(prompt).width <= width - 60) {
		context.fillText(prompt, width / 2, height - 30, width - 60);
		context.font = 120 + FONT_STACK;
		context.fillText(title, width / 2, height / 2 - 10);
	} else {
		let line1 = [];
		let line2 = prompt.split(" ");
		const originalWidth = context.measureText(prompt).width;
		// Keep line 1 longer by looping on line 2's width instead of line 1's
		while (context.measureText(line2.join(" ")).width > originalWidth / 2) {
			line1.push(line2.shift());
		}
		context.fillText(line1.join(" "), width / 2, height - 70, width - 60);
		context.fillText(line2.join(" "), width / 2, height - 20, width - 60);
		context.font = 100 + FONT_STACK;
		context.fillText(title, width / 2, height / 2 - 10);
	}
}
exports.drawScreen = async function (path, keyword, prompt, responses) {
	// Easily change to SVG by adding `, "svg"` after `ROW_HEIGHT`
	const canvas = createCanvas(WIDTH, HEADER_HEIGHT + ROW_HEIGHT * responses.length);
	const context = canvas.getContext("2d");
	drawHeader(context, keyword, prompt, WIDTH, HEADER_HEIGHT);
	// Rows
	await responses.forEach(async (row, i) => {
		const offset = HEADER_HEIGHT + ROW_HEIGHT * i;
		context.fillStyle = `hsl(0, 0%, ${80 + 10 * (i % 2)}%)`;
		context.fillRect(0, offset, WIDTH, ROW_HEIGHT);
		context.fillStyle = "black";
		context.font = (ROW_HEIGHT / 3) + FONT_STACK;
		context.textAlign = "center";
		context.fillText(row[0], 60, offset + ROW_HEIGHT * 5 / 8);
		context.textAlign = "left";
		context.fillText(row[1], 120, offset + ROW_HEIGHT * 5 / 8, WIDTH - 180);
	});
	await fs.writeFile(path, canvas.toBuffer());
	console.log("Voting screen done");
	line++;
};
exports.drawResults = async function (path, round, prompt, rankings, header = false) {
	header = header ? HEADER_HEIGHT : 0;
	const canvas = createCanvas(WIDTH, header + 40 + ROW_HEIGHT * rankings.length);
	const context = canvas.getContext("2d");
	// Header
	if (header) {
		drawHeader(context, round + " Results", prompt, WIDTH, HEADER_HEIGHT);
	}
	context.fillStyle = "white";
	context.fillRect(0, header, WIDTH, 40);
	context.fillStyle = "black";
	context.font = 30 + FONT_STACK;
	context.textAlign = "right";
	context.fillText("Rank", 120, header + 30);
	context.textAlign = "center";
	context.fillText("Book", 180, header + 30);
	context.textAlign = "left";
	context.fillText("Author — Response", 240, header + 30);
	context.fillText("Percentile", WIDTH - 820, header + 30);
	context.fillText("Std. Deviation", WIDTH - 550, header + 30);
	context.fillText("Skew", WIDTH - 265, header + 30);
	context.fillText("Votes", WIDTH - 100, header + 30);
	// Rankings
	const hues = {
		"prize": "hsl(50, 90%, ",
		"alive": "hsl(100, 90%, ",
		"danger": "hsl(30, 90%, ",
		"dead": "hsl(0, 90%, ",
		"dummy": "hsl(0, 0%, ",
		"drp": "hsl(0, 0%, "
	};
	let typeFreqs = {};
	await rankings.forEach(async (ranking, i) => {
		const offset = header + 40 + ROW_HEIGHT * i;
		// Background
		typeFreqs[ranking.type] ??= 0;
		typeFreqs[ranking.type]++;
		context.fillStyle = hues[ranking.type] + (80 - 10 * (typeFreqs[ranking.type] % 2)) + "%)";
		context.fillRect(0, offset, WIDTH, ROW_HEIGHT);
		// Text
		context.fillStyle = "black";
		context.font = (ROW_HEIGHT * 2 / 3) + FONT_STACK;
		context.textAlign = "right";
		context.fillText(ranking.rank ?? "—", 120, offset + ROW_HEIGHT * 3 / 4);
		context.textAlign = "left";
		context.font = (ROW_HEIGHT / 2) + FONT_STACK;
		context.fillText(ranking.name, 120 + ROW_HEIGHT, offset + ROW_HEIGHT / 2);
		context.font = (ROW_HEIGHT / 4) + FONT_STACK;
		context.fillText(ranking.response, 123 + ROW_HEIGHT, offset + ROW_HEIGHT * 5 / 6, WIDTH - ROW_HEIGHT - 1000);
		context.font = (ROW_HEIGHT / 2) + FONT_STACK;
		context.textAlign = "right";
		context.fillText(ranking.percentile.toFixed(2) + "%", WIDTH - 600, offset + ROW_HEIGHT * 7 / 10);
		context.fillText(ranking.stDev.toFixed(2) + "%", WIDTH - 330, offset + ROW_HEIGHT * 7 / 10);
		context.fillText(ranking.skew.toFixed(2).replace("-", "–"), WIDTH - 140, offset + ROW_HEIGHT * 7 / 10);
		context.fillText(ranking.votes, WIDTH - 20, offset + ROW_HEIGHT * 7 / 10);
		const book = await loadImage("books/" + (ranking.book ?? "default-book.png"));
		context.drawImage(book, 120, offset, ROW_HEIGHT, ROW_HEIGHT);
	});
	await fs.writeFile(path, canvas.toBuffer());
	console.log("Results screen done");
	line++;
};
// Progress bar
const SIZE = (process.stdout.columns ?? 80) - 10;
const SHADES = "░▒▓";
let shade = 0;
let line = 0;
class ProgressBar {
	constructor (command) {
		readline.cursorTo(process.stdout, 0);
		process.stdout.write(`${command}\n[${" ".repeat(SIZE)}] 0%\n`);
		line += Math.ceil(command.length / process.stdout.columns) + 1;
		this.bar = SHADES[shade % 3];
		shade++;
		this.line = line - 1;
		this.prevProgress = 0;
	}
	fill(frames) {
		const progress = Math.floor(frames / FRAMES * SIZE);
		readline.cursorTo(process.stdout, this.prevProgress + 1);
		readline.moveCursor(process.stdout, 0, this.line - line);
		process.stdout.write(this.bar.repeat(progress - this.prevProgress));
		readline.cursorTo(process.stdout, SIZE + 3);
		process.stdout.write(`${Math.floor(frames / FRAMES * 100)}%`);
		readline.cursorTo(process.stdout, 0);
		readline.moveCursor(process.stdout, 0, line - this.line);
		this.prevProgress = progress;
	}
}
// Draw 1b1s
const WIDTH_1B1S = 1920;
const HEIGHT_1B1S = 1080;
const FRAMES = 360;
const BOOK_MARGIN = 30;
const BAR_HEIGHT = 180;
const BAR_BUFFER = 60;
const MARKER_HEIGHT = 20;
async function drawFrames(output, round, prompt, contestant) {
	const imageBar = new ProgressBar(`Drawing pictures`);
	const canvas = createCanvas(WIDTH_1B1S, HEIGHT_1B1S);
	const context = canvas.getContext("2d"); // This is going into a video
	// Draw background
	context.fillStyle = "white";
	context.fillRect(0, 0, WIDTH_1B1S, HEIGHT_1B1S);
	drawHeader(context, round + " Results", prompt, WIDTH_1B1S, HEIGHT_1B1S / 4);
	const book = await loadImage("books/" + (contestant.book ?? "default-book.png"));
	context.drawImage(book, BOOK_MARGIN, HEIGHT_1B1S / 4, HEIGHT_1B1S / 2, HEIGHT_1B1S / 2);
	context.fillStyle = "black";
	context.font = 80 + FONT_STACK;
	context.textAlign = "left";
	const maxWidth = WIDTH_1B1S - HEIGHT_1B1S / 2 - 2 * BOOK_MARGIN;
	context.fillText(contestant.name, BOOK_MARGIN + HEIGHT_1B1S / 2, HEIGHT_1B1S / 4 + 120, maxWidth);
	context.font = 40 + FONT_STACK;
	// Split the response into two lines
	if (context.measureText(contestant.response).width <= maxWidth - 60) {
		context.fillText(contestant.response, BOOK_MARGIN + HEIGHT_1B1S / 2, HEIGHT_1B1S / 4 + 200, maxWidth);
	} else {
		let line1 = [];
		let line2 = contestant.response.split(" ");
		const originalWidth = context.measureText(contestant.response).width;
		// Keep line 1 longer by looping on line 2's width instead of line 1's
		while (context.measureText(line2.join(" ")).width > originalWidth / 2) {
			line1.push(line2.shift());
		}
		context.fillText(line1.join(" "), BOOK_MARGIN + HEIGHT_1B1S / 2, HEIGHT_1B1S / 4 + 200, maxWidth);
		context.fillText(line2.join(" "), BOOK_MARGIN + HEIGHT_1B1S / 2, HEIGHT_1B1S / 4 + 250, maxWidth);
	}
	// Draw movement
	let framesWritten = 0;
	for (let frame = 0; frame < FRAMES; frame++) {
		// HSL to RGB conversion
		const hue = frame / FRAMES * 360;
		const sat = 0.8;
		const light = 0.5;
		const f = n => {
			const chroma = sat * Math.min(light, 1 - light);
			const h = (n + hue / 30) % 12;
			const component = Math.max(-1, Math.min(h - 3, 9 - h, 1));
			return light - chroma * component;
		};
		const [R, G, B] = [f(0), f(8), f(4)];
		// Luma calculation (rough equivalent to perceptual brightness)
		const luma = 0.2126 * R + 0.7152 * G + 0.0722 * B;
		// Rectangles
		context.fillStyle = "white";
		context.fillRect(0, HEIGHT_1B1S - BAR_HEIGHT - BAR_BUFFER - MARKER_HEIGHT, WIDTH_1B1S, BAR_HEIGHT + 2 * MARKER_HEIGHT);
		context.fillStyle = "silver";
		context.fillRect(0, HEIGHT_1B1S - BAR_HEIGHT - BAR_BUFFER, WIDTH_1B1S, BAR_HEIGHT);
		context.fillStyle = `hsla(${frame * 360 / FRAMES}, 100%, ${(0.7 - luma / 2) * 100}%, 0.15)`;
		let x = Math.max(Math.round((1 - frame / (FRAMES - 1)) * WIDTH_1B1S), contestant.percentile / 100 * WIDTH_1B1S);
		context.fillRect(0, HEIGHT_1B1S - BAR_HEIGHT - BAR_BUFFER, x, BAR_HEIGHT);
		// Markers
		context.fillStyle = "black";
		context.font = 20 + FONT_STACK;
		context.textAlign = "center";
		for (let markerPercent = 0.1; markerPercent <= 0.9; markerPercent += 0.1) {
			let percentX = Math.round(markerPercent * WIDTH_1B1S);
			context.fillRect(percentX, HEIGHT_1B1S - BAR_HEIGHT - BAR_BUFFER - MARKER_HEIGHT / 2, 2, BAR_HEIGHT + MARKER_HEIGHT);
			context.fillText(` ${Math.round(markerPercent * 100)}%`, percentX, HEIGHT_1B1S - BAR_BUFFER + MARKER_HEIGHT + 20);
		}
		context.fillStyle = `hsl(${frame * 360 / FRAMES}, 90%, ${(0.7 - luma / 2) * 100}%)`;
		context.fillRect(x, HEIGHT_1B1S - BAR_HEIGHT - BAR_BUFFER - MARKER_HEIGHT, 5, BAR_HEIGHT + 2 * MARKER_HEIGHT);
		// Save to stream
		await new Promise(resolve => {
			if (output.write(canvas.toBuffer())) {
				resolve();
			} else {
				output.once("drain", resolve);
			}
		});
		framesWritten++;
		imageBar.fill(framesWritten);
	}
	output.end();
}
function convertVideo(command) {
	let videoBar;
	command
		.on("start", name => videoBar = new ProgressBar(name))
		.on("progress", progress => videoBar.fill(progress.frames)).run();
}
exports.draw1b1s = async function (path, round, prompt, contestant) {
	// Draw frames
	const output = new stream.PassThrough();
	drawFrames(output, round, prompt, contestant);
	// Create lossy video
	const lossyStream = new stream.PassThrough();
	output.pipe(lossyStream);
	const lossy = ffmpeg()
		.input(lossyStream).fromFormat("image2pipe").inputOption("-framerate 30").videoCodec("libx264")
		.input("../assets/goldberg.flac").audioCodec("aac").audioBitrate("192k")
		.output(`${path}-lossy.mp4`).outputOptions(["-pix_fmt yuv420p", "-crf 17", "-tune animation", "-shortest"]);
	convertVideo(lossy);
	// Create lossless video
	const losslessStream = new stream.PassThrough();
	output.pipe(losslessStream);
	const lossless = ffmpeg()
		.input(losslessStream).fromFormat("image2pipe").inputOption("-framerate 30").videoCodec("libx265")
		.input("../assets/goldberg.flac").audioCodec("copy")
		.output(`${path}-lossless.mkv`).outputOptions(["-x265-params lossless=1", "-shortest"]);
	convertVideo(lossless);
};
// Examples
exports.drawScreen("voting-test.png", "KEYWORD", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Assuming that Darrest is not efficiently utilizing fireworks to do so, how does he actually carefully formulate his legendary elongated and grandiloquent responses?", [
	["É", "Hi I'm Barry Scott! Bang and the éclair is gone"],
	["☹", "Efficiently utilizing fireworks, Darrest carefully formulates elongated and grandiloquent responses."],
	["M", "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM"],
	["龘", "我小时候很喜欢去麦当劳吃饭。那时候，我最近的麦当劳的价钱有点儿便宜。但是，他们今年涨价了！我有点儿生气。"],
	["🤖", "Για παρακαλώ συμπληρώστε την φόρμα στην οποία συμπληρώνετε το όνομά σας και το επίθετό σας. Μετά πατήστε το κουμπί για να εγγραφείτε στο πρόγραμμα."],
	["B", "Boost Boost Boost Boost Boost Boost Boost Boost Boost BOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOST"],
	["v", "very carefully"],
	["​", "I do not like big words. They are very bad.​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​"],
	["↺", "I'm immortal in time loops! I'm immortal in time loops!"],
	["—", "\"For the record, I'm not a copilot.\" — Copilot, given \"F\""],
]);
exports.drawResults("results-test.png", "Test Round", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Assuming that Darrest is not efficiently utilizing fireworks to do so, how does he actually carefully formulate his legendary elongated and grandiloquent responses?", [
	{
		type: "prize",
		rank: 1,
		book: "woooowoooo.png",
		name: "woooowoooo",
		response: "Boost Boost Boost Boost Boost Boost Boost Boost Boost BOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOST",
		percentile: 200,
		stDev: 20.21,
		skew: 0.6,
		votes: 17
	},
	{
		type: "prize",
		rank: 2,
		book: "woooowoooo.png",
		name: "twoooowoooo",
		response: "Hi I'm Barry Scott! Bang and the éclair is gone",
		percentile: 100,
		stDev: 0,
		skew: 0,
		votes: 6
	},
	{
		type: "alive",
		rank: 3,
		book: null,
		name: "Darrest (probably)",
		response: "Efficiently utilizing fireworks, Darrest carefully formulates elongated and grandiloquent responses.",
		percentile: 85.32,
		stDev: 17.78,
		skew: -0.51,
		votes: 100
	},
	{
		type: "dummy",
		rank: 4,
		book: null,
		name: "GitHub Copilot",
		response: "\"For the record, I'm not a copilot.\" — Copilot, given \"F\"",
		percentile: 69.69,
		stDev: 37.5,
		skew: 0.2,
		votes: 27
	},
	{
		type: "alive",
		rank: 5,
		book: "woooowoooo.png",
		name: "I forgor 💀",
		response: "I'm immortal in time loops! I'm immortal in time loops!",
		percentile: 50,
		stDev: 33.3,
		skew: -0.2,
		votes: 5
	},
	{
		type: "danger",
		rank: 6,
		book: "woooowoooo.png",
		name: "Super Idol 的笑容都没你的甜",
		response: "我小时候很喜欢去麦当劳吃饭。那时候，我最近的麦当劳的价钱有点儿便宜。但是，他们去年涨价了！",
		percentile: 43.21,
		stDev: 2.58,
		skew: 0.17,
		votes: 12
	},
	{
		type: "danger",
		rank: 7,
		book: null,
		name: "Trojanikeman8",
		response: "I do not like big words. They are very bad.​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​",
		percentile: 40,
		stDev: 45.22,
		skew: 0,
		votes: 1
	},
	{
		type: "dummy",
		rank: 8,
		book: null,
		name: "GitHub Copilot",
		response: "Για παρακαλώ συμπληρώστε την φόρμα στην οποία συμπληρώνετε το όνομά σας και το επίθετό σας. Μετά πατήστε το κουμπί για να εγγραφείτε στο πρόγραμμα.",
		percentile: 23.45,
		stDev: 10,
		skew: 0.3,
		votes: 15
	},
	{
		type: "dead",
		rank: 9,
		book: null,
		name: "mycelium4",
		response: "very carefully",
		percentile: 20.21,
		stDev: 12.29,
		skew: 0.52,
		votes: 18
	},
	{
		type: "dead",
		rank: 10,
		book: null,
		name: "the entire atlantic ocean",
		response: "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
		percentile: 0.69,
		stDev: 1.23,
		skew: 0.89,
		votes: 29
	}
], true);
exports.draw1b1s("1b1-test", "Test Round", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Assuming that Darrest is not efficiently utilizing fireworks to do so, how does he actually carefully formulate his legendary elongated and grandiloquent responses?", {
	book: null,
	name: "Darrest (probably)",
	response: "Efficiently utilizing fireworks, Darrest carefully formulates elongated and grandiloquent responses.",
	percentile: 85.32,
	stDev: 17.78
});