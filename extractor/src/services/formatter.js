import { convertFile } from "../converter.js";
import { convertToText } from "../utils/convertToText.js";
import { isPdfFile } from "../utils/pdfValidator.js";

/**
 * Extracts markdown content from a PDF.
 * @param {object} options - Options for extracting the markdown.
 * @param {string} options.file - The PDF file.
 * @param {string} [options.model] - The LLM model to use.
 * @returns {Promise<string>} - The markdown content.
 */
const getMarkdown = async ({ file, model }) => {
	try {
		if (!file) {
			throw new Error("File is required.");
		}

		if (!isPdfFile(file)) {
			throw new Error("File must be a PDF.");
		}

		const { markdown } = await convertFile(file, model);

		if (!markdown) {
			throw new Error("Failed to extract markdown.");
		}

		return markdown;
	} catch (error) {
		console.error("Error extracting markdown:", error);
		throw error;
	}
};

/**
 * Extracts plain text from a PDF by converting markdown to text.
 * @param {object} options - Options for extracting the plain text.
 * @param {string} options.file - The path to the PDF file.
 * @param {string} [options.model] - The LLM model to use.
 * @returns {Promise<string>} - The plain text content.
 */
const getPlainText = async ({ file, model }) => {
	try {
		const markdown = await getMarkdown({ file, model });
		return convertToText(markdown);
	} catch (error) {
		console.error("Error extracting plain text:", error);
		throw error;
	}
};

/**
 * Formatter object for various formats.
 */
export const formatter = {
	markdown: getMarkdown,
	plaintext: getPlainText,
};
