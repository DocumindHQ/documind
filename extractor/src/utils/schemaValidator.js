/**
 * Validates the schema format to ensure it meets the required structure.
 * @param {Array} schema - The schema to validate.
 * @returns {Object} - { isValid: boolean, errors: Array<string> }
 */
export function validateSchema(schema) {
	const validTypes = ["string", "number", "array", "object", "boolean", "enum"];
	const errors = [];

	if (!Array.isArray(schema)) {
		errors.push("Schema must be an array.");
		return { isValid: false, errors };
	}

	function validateField(field, path) {
		if (
			!Object.prototype.hasOwnProperty.call(field, "name") ||
			typeof field.name !== "string" ||
			field.name.trim() === ""
		) {
			errors.push(
				`"name" is required and should be a non-empty string at ${path}`,
			);
		}

		if (
			!Object.prototype.hasOwnProperty.call(field, "type") ||
			!validTypes.includes(field.type)
		) {
			errors.push(
				`"type" is required and must be one of ${validTypes.join(", ")} at ${path}`,
			);
		}
		if (
			!Object.prototype.hasOwnProperty.call(field, "description") ||
			typeof field.description !== "string" ||
			field.description.trim() === ""
		) {
			errors.push(
				`"description" is required and should be a non-empty string at ${path}`,
			);
		}

		// Additional checks for arrays
		if (field.type === "array") {
			if (!Object.prototype.hasOwnProperty.call(field, "children")) {
				errors.push(`"children" property is required for arrays at ${path}`);
			} else if (
				!Array.isArray(field.children) ||
				field.children.length === 0
			) {
				errors.push(`"children" must be a non-empty array at ${path}`);
			} else {
				// Recursively validate each child
				field.children.forEach((child, index) =>
					validateField(child, `${path}.children[${index}]`),
				);
			}
		}

		// Additional checks for enum
		if (field.type === "enum") {
			if (
				!Object.prototype.hasOwnProperty.call(field, "values") ||
				!Array.isArray(field.values) ||
				field.values.length === 0
			) {
				errors.push(
					`"values" is required and must be a non-empty array for enum at ${path}`,
				);
			} else if (!field.values.every((value) => typeof value === "string")) {
				errors.push(`"values" for enum at ${path} must be an array of strings`);
			}
		}
	}

	schema.forEach((field, index) => validateField(field, `schema[${index}]`));

	return {
		isValid: errors.length === 0,
		errors,
	};
}
