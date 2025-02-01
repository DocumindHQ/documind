import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { convertFile } from "./converter.js";
import { autogenerateSchema } from "./utils/autogenerateSchema.js";
import { convertToZodSchema } from "./utils/convertToZodSchema.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const extractData = async (
	pdfFilePath,
	schemaDefinition,
	model,
	parseModel,
	autoSchema,
	additionalPrompt,
) => {
	const prompt = `
    You are an expert in structured data extraction. Your task is to extract information from unstructured content and transform it into the specified structure. Follow these rules strictly:

   1. Handle Missing or Undetermined Data:
   - If any field's information is missing, unknown, or cannot be determined, return its value as null.
   - **Do not use substitutes such as "unknown," "missing," or any other placeholder for missing or unknown data. The value **must** always be explicitly null.

   2. Language and Text:
   - Preserve the original language of the content
   - Maintain original terminology and technical terms
   - Keep proper nouns unchanged


   ${additionalPrompt}
   `;

	try {
		const { markdown, totalPages, fileName } = await convertFile(
			pdfFilePath,
			model,
		);

		// Determine which schema to use
		let finalSchema = schemaDefinition;
		if (autoSchema) {
			finalSchema = await autogenerateSchema(markdown, parseModel);

			if (!finalSchema) {
				throw new Error("Failed to auto-generate schema.");
			}
		}

		// Convert the schema (whether generated or passed) to Zod
		const dynamicZodSchema = convertToZodSchema(finalSchema);

		const completion = await openai.beta.chat.completions.parse({
			model: parseModel ?? "gpt-4o-2024-08-06",
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: markdown,
				},
			],
			response_format: zodResponseFormat(dynamicZodSchema, "event"),
		});

		const event = completion.choices[0].message.parsed;

		return {
			event,
			totalPages,
			fileName,
		};
	} catch (error) {
		console.error("Error running OpenAI API call:", error);
		throw error;
	}
};
