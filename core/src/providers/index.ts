import { Completion } from "./utils/completion";
import { OpenAI } from "./openAI";
import { Ollama } from "./ollama";
import { Google } from "./google";
import { VLLM } from "./vllm"
import { ModelOptions, OpenAIModels, LocalModels, GoogleModels, VLLMModels } from "../types";

export class getModel {
  public static getProviderForModel(model: ModelOptions): Completion {
    if (Object.values(OpenAIModels).includes(model as OpenAIModels)) {
      return new OpenAI();
    }
    if (Object.values(GoogleModels).includes(model as GoogleModels)) {
      return new Google();
    }
    if (Object.values(LocalModels).includes(model as LocalModels)) {
      return new Ollama();
    }
    if (Object.values(VLLMModels).includes(model as VLLMModels)) {
      return new VLLM();
    }

    throw new Error(`No provider found for model "${model}"`);
  }
}
