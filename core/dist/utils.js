"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertKeysToSnakeCase = exports.convertFileToPdf = exports.convertPdfToImages = exports.getTextFromImage = exports.downloadFile = exports.isValidUrl = exports.isString = exports.formatMarkdown = exports.encodeImageToBase64 = exports.validateLLMParams = void 0;
const promises_1 = require("node:stream/promises");
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const libreoffice_convert_1 = require("libreoffice-convert");
const mime_types_1 = __importDefault(require("mime-types"));
const pdf2pic_1 = require("pdf2pic");
const sharp_1 = __importDefault(require("sharp"));
const Tesseract = __importStar(require("tesseract.js"));
const convertAsync = (0, util_1.promisify)(libreoffice_convert_1.convert);
const defaultLLMParams = {
    frequencyPenalty: 0, // OpenAI defaults to 0
    maxTokens: 2000,
    presencePenalty: 0, // OpenAI defaults to 0
    temperature: 0,
    topP: 1, // OpenAI defaults to 1
};
const validateLLMParams = (params) => {
    const validKeys = Object.keys(defaultLLMParams);
    for (const [key, value] of Object.entries(params)) {
        if (!validKeys.includes(key)) {
            throw new Error(`Invalid LLM parameter: ${key}`);
        }
        if (typeof value !== "number") {
            throw new Error(`Value for '${key}' must be a number`);
        }
    }
    return { ...defaultLLMParams, ...params };
};
exports.validateLLMParams = validateLLMParams;
const encodeImageToBase64 = async (imagePath) => {
    const imageBuffer = await fs_extra_1.default.readFile(imagePath);
    return imageBuffer.toString("base64");
};
exports.encodeImageToBase64 = encodeImageToBase64;
// Strip out the ```markdown wrapper
const formatMarkdown = (text) => {
    let formattedMarkdown = text?.trim();
    let loopCount = 0;
    const maxLoops = 3;
    const startsWithMarkdown = formattedMarkdown.startsWith("```markdown");
    while (startsWithMarkdown && loopCount < maxLoops) {
        const endsWithClosing = formattedMarkdown.endsWith("```");
        if (startsWithMarkdown && endsWithClosing) {
            const outermostBlockRegex = /^```markdown\n([\s\S]*?)\n```$/;
            const match = outermostBlockRegex.exec(formattedMarkdown);
            if (match) {
                formattedMarkdown = match[1].trim();
                loopCount++;
            }
            else {
                break;
            }
        }
        else {
            break;
        }
    }
    return formattedMarkdown;
};
exports.formatMarkdown = formatMarkdown;
const isString = (value) => {
    return value !== null;
};
exports.isString = isString;
const isValidUrl = (string) => {
    let url;
    try {
        url = new URL(string);
    }
    catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
};
exports.isValidUrl = isValidUrl;
// Save file to local tmp directory
const downloadFile = async ({ filePath, tempDir, }) => {
    // Shorten the file name by removing URL parameters
    const baseFileName = path_1.default.basename(filePath.split("?")[0]);
    const localPath = path_1.default.join(tempDir, baseFileName);
    let mimetype;
    // Check if filePath is a URL
    if ((0, exports.isValidUrl)(filePath)) {
        const writer = fs_extra_1.default.createWriteStream(localPath);
        const response = await (0, axios_1.default)({
            url: filePath,
            method: "GET",
            responseType: "stream",
        });
        if (response.status !== 200) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        mimetype = response.headers?.["content-type"];
        await (0, promises_1.pipeline)(response.data, writer);
    }
    else {
        // If filePath is a local file, copy it to the temp directory
        await fs_extra_1.default.copyFile(filePath, localPath);
    }
    if (!mimetype) {
        mimetype = mime_types_1.default.lookup(localPath);
    }
    let extension = mime_types_1.default.extension(mimetype) || "";
    if (!extension) {
        if (mimetype === "binary/octet-stream") {
            extension = ".bin";
        }
        else {
            throw new Error("File extension missing");
        }
    }
    if (!extension.startsWith(".")) {
        extension = `.${extension}`;
    }
    return { extension, localPath };
};
exports.downloadFile = downloadFile;
// Extract text confidence from image buffer using Tesseract
const getTextFromImage = async (buffer) => {
    try {
        // Get image and metadata
        const image = (0, sharp_1.default)(buffer);
        const metadata = await image.metadata();
        // Crop to a 150px wide column in the center of the document.
        // This section produced the highest confidence/speed tradeoffs.
        const cropWidth = 150;
        const cropHeight = metadata.height || 0;
        const left = Math.max(0, Math.floor((metadata.width - cropWidth) / 2));
        const top = 0;
        // Extract the cropped image
        const croppedBuffer = await image
            .extract({ left, top, width: cropWidth, height: cropHeight })
            .toBuffer();
        // Pass the croppedBuffer to Tesseract.recognize
        // @TODO: How can we generalize this to non eng languages?
        const { data: { confidence }, } = await Tesseract.recognize(croppedBuffer, "eng");
        return { confidence };
    }
    catch (error) {
        console.error("Error during OCR:", error);
        return { confidence: 0 };
    }
};
exports.getTextFromImage = getTextFromImage;
// Correct image orientation based on OCR confidence
// Run Tesseract on 4 different orientations of the image and compare the output
const correctImageOrientation = async (buffer) => {
    const image = (0, sharp_1.default)(buffer);
    const rotations = [0, 90, 180, 270];
    const results = await Promise.all(rotations.map(async (rotation) => {
        const rotatedImageBuffer = await image
            .clone()
            .rotate(rotation)
            .toBuffer();
        const { confidence } = await (0, exports.getTextFromImage)(rotatedImageBuffer);
        return { rotation, confidence };
    }));
    // Find the rotation with the best confidence score
    const bestResult = results.reduce((best, current) => current.confidence > best.confidence ? current : best);
    if (bestResult.rotation !== 0) {
        console.log(`Reorienting image ${bestResult.rotation} degrees (Confidence: ${bestResult.confidence}%).`);
    }
    // Rotate the image to the best orientation
    const correctedImageBuffer = await image
        .rotate(bestResult.rotation)
        .toBuffer();
    return correctedImageBuffer;
};
// Convert each page to a png, correct orientation, and save that image to tmp
const convertPdfToImages = async ({ localPath, pagesToConvertAsImages, tempDir, }) => {
    const options = {
        density: 300,
        format: "png",
        height: 1056,
        preserveAspectRatio: true,
        saveFilename: path_1.default.basename(localPath, path_1.default.extname(localPath)),
        savePath: tempDir,
    };
    const storeAsImage = (0, pdf2pic_1.fromPath)(localPath, options);
    try {
        const convertResults = await storeAsImage.bulk(pagesToConvertAsImages, {
            responseType: "buffer",
        });
        await Promise.all(convertResults.map(async (result) => {
            if (!result || !result.buffer) {
                throw new Error("Could not convert page to image buffer");
            }
            if (!result.page)
                throw new Error("Could not identify page data");
            const paddedPageNumber = result.page.toString().padStart(5, "0");
            // Correct the image orientation
            const correctedBuffer = await correctImageOrientation(result.buffer);
            const imagePath = path_1.default.join(tempDir, `${options.saveFilename}_page_${paddedPageNumber}.png`);
            await fs_extra_1.default.writeFile(imagePath, correctedBuffer);
        }));
        return convertResults;
    }
    catch (err) {
        console.error("Error during PDF conversion:", err);
        throw err;
    }
};
exports.convertPdfToImages = convertPdfToImages;
// Convert each page (from other formats like docx) to a png and save that image to tmp
const convertFileToPdf = async ({ extension, localPath, tempDir, }) => {
    const inputBuffer = await fs_extra_1.default.readFile(localPath);
    const outputFilename = path_1.default.basename(localPath, extension) + ".pdf";
    const outputPath = path_1.default.join(tempDir, outputFilename);
    try {
        const pdfBuffer = await convertAsync(inputBuffer, ".pdf", undefined);
        await fs_extra_1.default.writeFile(outputPath, pdfBuffer);
        return outputPath;
    }
    catch (err) {
        console.error(`Error converting ${extension} to .pdf:`, err);
        throw err;
    }
};
exports.convertFileToPdf = convertFileToPdf;
const camelToSnakeCase = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const convertKeysToSnakeCase = (obj) => {
    if (typeof obj !== "object" || obj === null) {
        return obj ?? {};
    }
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [camelToSnakeCase(key), value]));
};
exports.convertKeysToSnakeCase = convertKeysToSnakeCase;
