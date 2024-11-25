import { DocumindArgs, DocumindOutput } from "./types";
export declare const documind: ({ cleanup, concurrency, filePath, llmParams, maintainFormat, model, openaiApiEndpoint, openaiAPIKey, outputDir, pagesToConvertAsImages, tempDir, }: DocumindArgs) => Promise<DocumindOutput>;
