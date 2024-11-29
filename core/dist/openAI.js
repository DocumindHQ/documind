"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletion = void 0;
const utils_1 = require("./utils");
const axios_1 = __importDefault(require("axios"));
const getCompletion = async ({ openaiApiEndpoint, openaiApiKey, imagePath, llmParams, maintainFormat, model, priorPage, }) => {
    const systemPrompt = `
    Convert the following document page to markdown.
    Return only the markdown with no explanation text. Do not include deliminators like '''markdown.
    You must include all information on the page. Do not exclude headers, footers, or subtext.
  `;
    // Default system message.
    const messages = [{ role: "system", content: systemPrompt }];
    // If content has already been generated, add it to context.
    // This helps maintain the same format across pages
    if (maintainFormat && priorPage && priorPage.length) {
        messages.push({
            role: "system",
            content: `Markdown must maintain consistent formatting with the following page: \n\n """${priorPage}"""`,
        });
    }
    // Add Image to request
    const base64Image = await (0, utils_1.encodeImageToBase64)(imagePath);
    messages.push({
        role: "user",
        content: [
            {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64Image}` },
            },
        ],
    });
    try {
        const response = await axios_1.default.post("https://${openaiApiEndpoint}/v1/chat/completions", {
            messages,
            model,
            ...(0, utils_1.convertKeysToSnakeCase)(llmParams ?? null),
        }, {
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
            },
        });
        const data = response.data;
        return {
            content: data.choices[0].message.content,
            inputTokens: data.usage.prompt_tokens,
            outputTokens: data.usage.completion_tokens,
        };
    }
    catch (err) {
        console.error("Error in OpenAI completion", err);
        throw err;
    }
};
exports.getCompletion = getCompletion;
