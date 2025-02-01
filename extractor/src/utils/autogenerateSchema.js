import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Recursively cleans schema fields by removing empty `children` arrays.
 * @param {Array} fields - The schema fields to clean.
 * @returns {Array} - Cleaned schema fields.
 */
const cleanSchemaFields = (fields) => {
	return fields.map((field) => {
		if (field.children && field.children.length === 0) {
			// Remove empty children arrays
			field.children = undefined;
		} else if (field.children) {
			// Recursively clean nested children
			field.children = cleanSchemaFields(field.children);
		}
		return field;
	});
};

/**
 * Generates an auto schema from markdown content.
 * @param {string} markdown - The markdown content to generate the schema from.
 * @returns {Promise<Array>} - The auto-generated schema.
 */
export const autogenerateSchema = async (markdown) => {
	const prompt = `
Read the following markdown content and generate a schema of useful structured data that can be extracted from it. Follow these rules strictly:
- The \`children\` field **must only be present if the \`type\` is \`object\` or \`array\`. It should never exist for other types.
- \`description\` fields should be concise, no longer than one sentence.
"""${markdown}"""
`;

	try {
		// Define schema validation using Zod
		const SchemaField = z.lazy(() =>
			z.object({
				name: z.string(),
				type: z.enum(["string", "number", "array", "object"]),
				description: z.string().optional(),
				children: z.array(SchemaField).optional(),
			}),
		);

		const Schema = z.object({
			fields: z.array(SchemaField),
		});

		// Call OpenAI to generate schema
		const completion = await openai.beta.chat.completions.parse({
			model: "gpt-4o-2024-08-06", // Use the appropriate model
			messages: [{ role: "user", content: prompt }],
			response_format: zodResponseFormat(Schema, "event"),
		});

		// Parse and clean the schema
		const event = completion.choices[0].message.parsed;
		const cleanedFields = cleanSchemaFields(event.fields);

		return cleanedFields;
	} catch (error) {
		console.error("Error auto generating schema:", error);
		throw error;
	}
};
