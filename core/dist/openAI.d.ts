import { CompletionArgs, CompletionResponse } from "./types";
export declare const getCompletion: ({ openaiApiEndpoint, openaiApiKey, imagePath, llmParams, maintainFormat, model, priorPage, }: CompletionArgs) => Promise<CompletionResponse>;
