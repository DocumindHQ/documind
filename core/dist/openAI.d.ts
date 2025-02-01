import type { CompletionArgs, CompletionResponse } from "./types";
export declare const getCompletion: ({ apiKey, imagePath, llmParams, maintainFormat, model, priorPage, }: CompletionArgs) => Promise<CompletionResponse>;
