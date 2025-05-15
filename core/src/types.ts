export enum OpenAIModels {
  GPT_4O = "gpt-4o",
  GPT_4O_MINI = "gpt-4o-mini",
  GPT_4_1 = "gpt-4.1",
  GPT_4_1_MINI = "gpt-4.1-mini",
}

export enum VLLMModels {
  QWEN_2_5_3B_Instruct = "Qwen/Qwen2.5-VL-3B-Instruct",
  QWEN_2_5_72B_Instruct = "Qwen/Qwen2.5-VL-72B-Instruct",
}

export enum LocalModels {
  //LLAVA = "llava",
  LLAMA3_2_VISION = "llama3.2-vision",
}

export enum GoogleModels {
  GEMINI_2_FLASH = "gemini-2.0-flash-001",
  GEMINI_2_FLASH_LITE = "gemini-2.0-flash-lite-preview-02-05",
  GEMINI_1_5_FLASH = "gemini-1.5-flash",
  GEMINI_1_5_FLASH_8B = "gemini-1.5-flash-8b",
  GEMINI_1_5_PRO = "gemini-1.5-pro",
}

export type ModelOptions = OpenAIModels | GoogleModels | LocalModels | VLLMModels;

export interface DocumindArgs {
  cleanup?: boolean;
  concurrency?: number;
  filePath: string;
  llmParams?: LLMParams;
  maintainFormat?: boolean;
  model?: ModelOptions;
  outputDir?: string;
  pagesToConvertAsImages?: number | number[];
  tempDir?: string;
}

export interface Page {
  content: string;
  contentLength: number;
  page: number;
}

export interface DocumindOutput {
  completionTime: number;
  fileName: string;
  inputTokens: number;
  outputTokens: number;
  pages: Page[];
}

export interface CompletionResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionArgs {
  imagePath: string;
  llmParams?: LLMParams;
  maintainFormat: boolean;
  model: ModelOptions;
  priorPage: string;
}

export interface LLMParams {
  frequencyPenalty?: number;
  maxTokens?: number;
  presencePenalty?: number;
  temperature?: number;
  topP?: number;
}
