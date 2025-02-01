export const generateMarkdownDocument = async (pages) => {
	try {
		// Combine all markdown pages into a single string
		const markdownContent = pages
			.map((page) => page.content)
			.join("\n\n---\n\n");

		// Return the combined markdown string directly
		return markdownContent;
	} catch (error) {
		console.error("Error generating markdown:", error);
		throw error;
	}
};
