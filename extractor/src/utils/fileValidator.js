import axios from "axios";

/**
 * Function to check if a file is valid based on its URL or MIME type
 * @param {string} file - The URL to the file
 * @returns {Promise<boolean>} - Resolves to true if the file is valid, false otherwise
 */
export async function isValidFile(file) {
	const allowedExtensions = [
		"pdf",
		"png",
		"jpg",
		"jpeg",
		"txt",
		"docx",
		"html",
	];
	const allowedMimeTypes = {
		pdf: "application/pdf",
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		txt: "text/plain",
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		html: "text/html",
	};

	const urlPath = new URL(file).pathname;
	const extensionRegex = new RegExp(
		`\\.(${allowedExtensions.join("|")})$`,
		"i",
	);

	if (!extensionRegex.test(urlPath)) {
		return false;
	}

	// Optional: Check the MIME type if query parameters are used
	try {
		const response = await axios.head(file);
		const contentType = response.headers["content-type"];
		return Object.values(allowedMimeTypes).some((mime) =>
			contentType.startsWith(mime),
		);
	} catch (error) {
		console.error("Error checking MIME type:", error);
		return false;
	}
}
