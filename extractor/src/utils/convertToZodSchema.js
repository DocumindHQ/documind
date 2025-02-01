import { z } from "zod";

/**
 * Converts an array of type definitions into a Zod schema.
 * @param {Array} object - Array of field definitions.
 * @returns {ZodObject} - A Zod object schema.
 */
export const convertToZodSchema = (object) => {
	const createZodSchema = (obj) => {
		const schema = {};

		for (const item of obj) {
			let zodType;
			switch (item.type) {
				case "string":
					zodType = z.string();
					break;
				case "number":
					zodType = z.number();
					break;
				case "boolean":
					zodType = z.boolean();
					break;
				case "array":
					if (item.children && item.children.length > 0) {
						const arraySchema = createZodSchema(item.children);
						zodType = z.array(z.object(arraySchema));
					} else {
						throw new Error(
							`Invalid or unsupported "array" type definition for ${item.name}`,
						);
					}
					break;
				case "object":
					if (item.children) {
						zodType = z.object(createZodSchema(item.children));
					} else {
						throw new Error(
							`Invalid "object" type definition for ${item.name}`,
						);
					}
					break;
				case "enum":
					if (item.values && Array.isArray(item.values)) {
						zodType = z.enum(item.values);
					} else {
						throw new Error(`Invalid "enum" type definition for ${item.name}`);
					}
					break;
				default:
					throw new Error(
						`Unsupported type "${item.type}" for field ${item.name}`,
					);
			}

			if (item.description) {
				zodType = zodType.describe(item.description);
			}

			schema[item.name] = zodType;
		}

		return schema;
	};

	return z.object(createZodSchema(object));
};
