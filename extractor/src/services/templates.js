import fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDirectory = path.resolve(__dirname, "../templates");

/**
 * Lists all available templates.
 * @returns {string[]} - Array of template names.
 */
export function listTemplates() {
	return fs
		.readdirSync(templatesDirectory)
		.filter((file) => file.endsWith(".json"))
		.map((file) => file.replace(".json", ""));
}

/**
 * Retrieves a specific template.
 * @param {string} name - The name of the template.
 * @returns {object} - The template content.
 * @throws {Error} - If the template is not found.
 */
export function getTemplate(name) {
	const templatePath = path.join(templatesDirectory, `${name}.json`);
	if (!fs.existsSync(templatePath)) {
		throw new Error(`Template "${name}" not found`);
	}
	return JSON.parse(fs.readFileSync(templatePath, "utf8"));
}

/**
 * Exports available templates.
 */
export const templates = {
	list: listTemplates,
	get: getTemplate,
};
