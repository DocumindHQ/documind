import { documind } from "core";
import { generateMarkdownDocument } from "./utils/generateMarkdown.js";

export const convertFile = async (filePath, model) => {
	try {
		const result = await documind({
			filePath,
			model,
			openaiAPIKey: process.env.OPENAI_API_KEY,
		});

		const { pages, fileName } = result;
		const totalPages = pages.length;

		const markdown = await generateMarkdownDocument(pages);
		console.log("Markdown generated", markdown);

		return { markdown, totalPages, fileName };
	} catch (error) {
		console.error("Error running documind core:", error);
	}
};
