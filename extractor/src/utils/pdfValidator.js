import axios from "axios";

/**
 * Function to check if a file is a PDF based on its URL or MIME type
 * @param {string} file - The URL to the file
 * @returns {Promise<boolean>} - Resolves to true if the file is a PDF, false otherwise
 */
export async function isPdfFile(file) {
	const urlPath = new URL(file).pathname;
	const pdfExtensionRegex = /\.pdf$/i;
	if (pdfExtensionRegex.test(urlPath)) {
		return true;
	}

	// Optional: Check the MIME type if query parameters are used
	try {
		const response = await axios.head(file);
		const contentType = response.headers["content-type"];
		return contentType === "application/pdf";
	} catch (error) {
		console.error("Error checking MIME type:", error);
		return false;
	}
}
