var __importDefault =
	(this && this.__importDefault) ||
	((mod) => (mod && mod.__esModule ? mod : { default: mod }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.documind = void 0;
const utils_1 = require("./utils");
const openAI_1 = require("./openAI");
const types_1 = require("./types");
const utils_2 = require("./utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const p_limit_1 = __importDefault(require("p-limit"));
const documind = async ({
	cleanup = true,
	concurrency = 10,
	filePath,
	llmParams = {},
	maintainFormat = false,
	model, //= ModelOptions.gpt_4o_mini,
	openaiAPIKey = "",
	outputDir,
	pagesToConvertAsImages = -1,
	tempDir = os_1.default.tmpdir(),
}) => {
	const baseUrl = process.env.BASE_URL || "https://api.openai.com/v1";
	const defaultModel =
		model ??
		(baseUrl !== "https://api.openai.com/v1"
			? types_1.ModelOptions.llava // Default for custom base URL
			: types_1.ModelOptions.gpt_4o_mini); // Default for OpenAI
	let inputTokenCount = 0;
	let outputTokenCount = 0;
	let priorPage = "";
	const aggregatedMarkdown = [];
	const startTime = new Date();
	llmParams = (0, utils_2.validateLLMParams)(llmParams);
	// Validators
	if (!openaiAPIKey || !openaiAPIKey.length) {
		throw new Error("Missing OpenAI API key");
	}
	if (!filePath || !filePath.length) {
		throw new Error("Missing file path");
	}
	// Ensure temp directory exists + create temp folder
	const rand = Math.floor(1000 + Math.random() * 9000).toString();
	const tempDirectory = path_1.default.join(
		tempDir || os_1.default.tmpdir(),
		`documind-file-${rand}`,
	);
	await fs_extra_1.default.ensureDir(tempDirectory);
	// Download the PDF. Get file name.
	const { extension, localPath } = await (0, utils_1.downloadFile)({
		filePath,
		tempDir: tempDirectory,
	});
	if (!localPath) throw "Failed to save file to local drive";
	// Sort the `pagesToConvertAsImages` array to make sure we use the right index
	// for `formattedPages` as `pdf2pic` always returns images in order
	if (Array.isArray(pagesToConvertAsImages)) {
		pagesToConvertAsImages.sort((a, b) => a - b);
	}
	// Convert file to PDF if necessary
	if (extension !== ".png") {
		let pdfPath;
		if (extension === ".pdf") {
			pdfPath = localPath;
		} else {
			pdfPath = await (0, utils_1.convertFileToPdf)({
				extension,
				localPath,
				tempDir: tempDirectory,
			});
		}
		// Convert the file to a series of images
		await (0, utils_1.convertPdfToImages)({
			localPath: pdfPath,
			pagesToConvertAsImages,
			tempDir: tempDirectory,
		});
	}
	const endOfPath = localPath.split("/")[localPath.split("/").length - 1];
	const rawFileName = endOfPath.split(".")[0];
	const fileName = rawFileName
		.replace(/[^\w\s]/g, "")
		.replace(/\s+/g, "_")
		.toLowerCase()
		.substring(0, 255); // Truncate file name to 255 characters to prevent ENAMETOOLONG errors
	// Get list of converted images
	const files = await fs_extra_1.default.readdir(tempDirectory);
	const images = files.filter((file) => file.endsWith(".png"));
	if (maintainFormat) {
		// Use synchronous processing
		for (const image of images) {
			const imagePath = path_1.default.join(tempDirectory, image);
			try {
				const { content, inputTokens, outputTokens } = await (0,
				openAI_1.getCompletion)({
					apiKey: openaiAPIKey,
					imagePath,
					llmParams,
					maintainFormat,
					model: defaultModel,
					priorPage,
				});
				const formattedMarkdown = (0, utils_1.formatMarkdown)(content);
				inputTokenCount += inputTokens;
				outputTokenCount += outputTokens;
				// Update prior page to result from last processing step
				priorPage = formattedMarkdown;
				// Add all markdown results to array
				aggregatedMarkdown.push(formattedMarkdown);
			} catch (error) {
				console.error(`Failed to process image ${image}:`, error);
				throw error;
			}
		}
	} else {
		// Process in parallel with a limit on concurrent pages
		const processPage = async (image) => {
			const imagePath = path_1.default.join(tempDirectory, image);
			try {
				const { content, inputTokens, outputTokens } = await (0,
				openAI_1.getCompletion)({
					apiKey: openaiAPIKey,
					imagePath,
					llmParams,
					maintainFormat,
					model: defaultModel,
					priorPage,
				});
				const formattedMarkdown = (0, utils_1.formatMarkdown)(content);
				inputTokenCount += inputTokens;
				outputTokenCount += outputTokens;
				// Update prior page to result from last processing step
				priorPage = formattedMarkdown;
				// Add all markdown results to array
				return formattedMarkdown;
			} catch (error) {
				console.error(`Failed to process image ${image}:`, error);
				throw error;
			}
		};
		// Function to process pages with concurrency limit
		const processPagesInBatches = async (images, limit) => {
			const results = [];
			const promises = images.map((image, index) =>
				limit(() =>
					processPage(image).then((result) => {
						results[index] = result;
					}),
				),
			);
			await Promise.all(promises);
			return results;
		};
		const limit = (0, p_limit_1.default)(concurrency);
		const results = await processPagesInBatches(images, limit);
		const filteredResults = results.filter(utils_1.isString);
		aggregatedMarkdown.push(...filteredResults);
	}
	// Write the aggregated markdown to a file
	if (outputDir) {
		const resultFilePath = path_1.default.join(outputDir, `${fileName}.md`);
		await fs_extra_1.default.writeFile(
			resultFilePath,
			aggregatedMarkdown.join("\n\n"),
		);
	}
	// Cleanup the downloaded PDF file
	if (cleanup) await fs_extra_1.default.remove(tempDirectory);
	// Format JSON response
	const endTime = new Date();
	const completionTime = endTime.getTime() - startTime.getTime();
	const formattedPages = aggregatedMarkdown.map((el, i) => {
		let pageNumber;
		// If we convert all pages, just use the array index
		if (pagesToConvertAsImages === -1) {
			pageNumber = i + 1;
		}
		// Else if we convert specific pages, use the page number from the parameter
		else if (Array.isArray(pagesToConvertAsImages)) {
			pageNumber = pagesToConvertAsImages[i];
		}
		// Else, the parameter is a number and use it for the page number
		else {
			pageNumber = pagesToConvertAsImages;
		}
		return { content: el, page: pageNumber, contentLength: el.length };
	});
	return {
		completionTime,
		fileName,
		inputTokens: inputTokenCount,
		outputTokens: outputTokenCount,
		pages: formattedPages,
	};
};
exports.documind = documind;
