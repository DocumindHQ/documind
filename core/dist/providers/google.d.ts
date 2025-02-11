import { Completion } from "./utils/completion";
import { CompletionArgs, CompletionResponse } from "../types";
export declare class Google implements Completion {
    getCompletion(args: CompletionArgs): Promise<CompletionResponse>;
}
