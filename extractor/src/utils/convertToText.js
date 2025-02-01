export const convertToText = (markdown) => {
	if (!markdown || typeof markdown !== "string") {
		throw new Error("Valid markdown content is required.");
	}

	// Strip markdown syntax and handle tables
	const plainText = markdown
		.replace(/(\*\*|__)(.*?)\1/g, "$2") // Bold
		.replace(/(\*|_)(.*?)\1/g, "$2") // Italic
		.replace(/(#+\s)/g, "") // Headings
		.replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
		.replace(/!\[(.*?)\]\(.*?\)/g, "$1") // Images
		.replace(/(```.*?\n[\s\S]*?\n```|`.*?`)/g, "") // Code blocks/inline
		.replace(/>+/g, "") // Blockquotes
		.replace(/\n{2,}/g, "\n") // Excess newlines
		.replace(/\|([^|]*)\|/g, (_, row) => row.trim()) // Table rows
		.replace(/-+/g, "") // Table dividers (---|---)
		.trim();

	return plainText;
};
