import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

export const openAIExtractor = async ({ markdown, zodSchema, prompt }) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const openAiModel = "gpt-4o-2024-08-06";

  const completion = await openai.beta.chat.completions.parse({
    model: openAiModel,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: markdown },
    ],
    response_format: zodResponseFormat(zodSchema, "event"),
  });

  const event = completion.choices[0].message.parsed;
  return event;
}
