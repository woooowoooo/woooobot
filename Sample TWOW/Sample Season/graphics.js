const fs = require("fs").promises;
const stream = require("stream");
const {createCanvas, loadImage} = require("canvas");
const ffmpeg = require("fluent-ffmpeg");
const FONT_STACK = "px Charter, serif";
const HEADER_HEIGHT = 240;
const ROW_HEIGHT = 120;
const WIDTH = 2400;
function drawHeader(context, title, prompt) {
	context.fillStyle = "white";
	context.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
	context.fillStyle = "black";
	context.font = 40 + FONT_STACK;
	context.textAlign = "center";
	// Split the prompt into two lines
	if (context.measureText(prompt).width <= WIDTH - 60) {
		context.fillText(prompt, WIDTH / 2, 210, WIDTH - 60);
		context.font = 120 + FONT_STACK;
		context.fillText(title, WIDTH / 2, 130);
	} else {
		let line1 = [];
		let line2 = prompt.split(" ");
		const originalWidth = context.measureText(prompt).width;
		// Keep line 1 longer by looping on line 2's width instead of line 1's
		while (context.measureText(line2.join(" ")).width > originalWidth / 2) {
			line1.push(line2.shift());
		}
		context.fillText(line1.join(" "), WIDTH / 2, 170, WIDTH - 60);
		context.fillText(line2.join(" "), WIDTH / 2, 220, WIDTH - 60);
		context.font = 100 + FONT_STACK;
		context.fillText(title, WIDTH / 2, 110);
	}
}
exports.drawScreen = async function (path, keyword, prompt, responses) {
	// Easily change to SVG by adding `, "svg"` after `ROW_HEIGHT`
	const canvas = createCanvas(WIDTH, HEADER_HEIGHT + ROW_HEIGHT * responses.length);
	const context = canvas.getContext("2d");
	drawHeader(context, keyword, prompt);
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
};
exports.drawResults = async function (path, round, prompt, rankings, header = false) {
	header = header ? HEADER_HEIGHT : 0;
	const canvas = createCanvas(WIDTH, header + 40 + ROW_HEIGHT * rankings.length);
	const context = canvas.getContext("2d");
	// Header
	if (header) {
		drawHeader(context, round + " Results", prompt);
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
};
// Draw 1b1s
const WIDTH_1B1S = 1920;
const HEIGHT_1B1S = 1080;
const FRAMES = 30;
async function drawFrames(output) {
	const canvas = createCanvas(WIDTH_1B1S, HEIGHT_1B1S);
	const context = canvas.getContext("2d", {alpha: false}); // This is going into a video
	context.font = (HEIGHT_1B1S / 3) + "px Avenir, \"URW Gothic\"";
	context.textAlign = "center";
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
		context.fillStyle = `hsl(${frame * 360 / FRAMES}, 80%, ${(0.75 - luma / 2) * 100}%)`;
		context.fillRect(0, 0, WIDTH_1B1S, HEIGHT_1B1S);
		context.fillStyle = "white";
		context.fillText(`Frame ${frame}`, WIDTH_1B1S / 2, (HEIGHT_1B1S + context.measureText(frame).emHeightAscent) / 2);
		await new Promise(resolve => {
			if (output.write(canvas.toBuffer())) {
				resolve();
			} else {
				output.once("drain", resolve);
			}
		});
	}
	output.end();
}
exports.draw1b1s = async function () {
	// Draw frames
	const output = new stream.PassThrough();
	drawFrames(output);
	// Create lossy video
	const lossyStream = new stream.PassThrough();
	output.pipe(lossyStream);
	ffmpeg()
		.input(lossyStream).fromFormat("image2pipe").inputOption("-framerate 30").videoCodec("libx264")
		.input("../assets/goldberg.flac").audioCodec("aac").audioBitrate("192k")
		.output(`${path}-lossy.mp4`).outputOptions(["-pix_fmt yuv420p", "-crf 17", "-tune animation", "-shortest"]).run();
	// Create lossless video
	const losslessStream = new stream.PassThrough();
	output.pipe(losslessStream);
	ffmpeg()
		.input(losslessStream).fromFormat("image2pipe").inputOption("-framerate 30").videoCodec("libx265")
		.input("../assets/goldberg.flac").audioCodec("copy")
		.output(`${path}-lossless.mkv`).outputOptions(["-x265-params lossless=1", "-shortest"]).run();
};