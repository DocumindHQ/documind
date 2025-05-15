import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

export const openAIExtractor = async ({ markdown, zodSchema, prompt, model }) => {
  if (!process.env.BASE_URL) {
    throw new Error("Missing BASE_URL");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const openai = new OpenAI({
    baseURL:process.env.BASE_URL,
    apiKey:process.env.OPENAI_API_KEY
  });
  
  const vllmModel = model;

  const completion = await openai.beta.chat.completions.parse({
    model: vllmModel,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: markdown },
    ],
    response_format: zodResponseFormat(zodSchema, "event"),
  });

  const event = completion.choices[0].message.parsed;
  return event;
}
