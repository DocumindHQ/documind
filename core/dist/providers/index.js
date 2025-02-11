"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModel = void 0;
const openAI_1 = require("./openAI");
const ollama_1 = require("./ollama");
const google_1 = require("./google");
const types_1 = require("../types");
class getModel {
    static getProviderForModel(model) {
        if (Object.values(types_1.OpenAIModels).includes(model)) {
            return new openAI_1.OpenAI();
        }
        if (Object.values(types_1.GoogleModels).includes(model)) {
            return new google_1.Google();
        }
        else if (Object.values(types_1.LocalModels).includes(model)) {
            return new ollama_1.Ollama();
        }
        throw new Error(`No provider found for model "${model}"`);
    }
}
exports.getModel = getModel;
