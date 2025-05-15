"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VLLM = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const utils_1 = require("../utils");
class VLLM {
    async getCompletion(args) {
        const { imagePath, llmParams, maintainFormat, model, priorPage, } = args;
        const baseUrl = process.env.BASE_URL;
        if (!baseUrl) {
            throw new Error("Missing BASE_URL in environment variables.");
        }
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("Missing OPENAI_API_KEY in environment variables.");
        }
        const apiKey = process.env.OPENAI_API_KEY;
        const validModels = Object.values(types_1.OpenAIModels);
        if (!validModels.includes(model)) {
            throw new Error(`Model "${model}" is not an OpenAI model.`);
        }
        const systemPrompt = `
    Convert the following image/document  to markdown. 
    Return only the markdown with no explanation text. Do not include deliminators like '''markdown.
    You must include all information on the page. Do not exclude headers, footers, or subtext.
  `;
        const messages = [{ role: "system", content: systemPrompt }];
        if (maintainFormat && priorPage) {
            messages.push({
                role: "system",
                content: `Please ensure markdown formatting remains consistent with the prior page:\n\n"""${priorPage}"""`,
            });
        }
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
            const response = await axios_1.default.post(`${baseUrl}/chat/completions`, {
                messages,
                model,
                ...(0, utils_1.convertKeysToSnakeCase)(llmParams ?? null),
            }, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });
            const data = response.data;
            return {
                content: data.choices[0].message.content,
                inputTokens: data.usage?.prompt_tokens ?? 0,
                outputTokens: data.usage?.completion_tokens ?? 0,
            };
        }
        catch (err) {
            console.error("OpenAI error:", err);
            throw err;
        }
    }
}
exports.VLLM = VLLM;
