import type { LLMParams } from "./types";
export declare const validateLLMParams: (params: Partial<LLMParams>) => LLMParams;
export declare const encodeImageToBase64: (imagePath: string) => Promise<string>;
export declare const formatMarkdown: (text: string) => string;
export declare const isString: (value: string | null) => value is string;
export declare const isValidUrl: (string: string) => boolean;
export declare const downloadFile: ({ filePath, tempDir, }: {
    filePath: string;
    tempDir: string;
}) => Promise<{
    extension: string;
    localPath: string;
}>;
export declare const getTextFromImage: (buffer: Buffer) => Promise<{
    confidence: number;
}>;
export declare const convertPdfToImages: ({ localPath, pagesToConvertAsImages, tempDir, }: {
    localPath: string;
    pagesToConvertAsImages: number | number[];
    tempDir: string;
}) => Promise<import("pdf2pic/dist/types/convertResponse").BufferResponse[]>;
export declare const convertFileToPdf: ({ extension, localPath, tempDir, }: {
    extension: string;
    localPath: string;
    tempDir: string;
}) => Promise<string>;
export declare const convertKeysToSnakeCase: (obj: Record<string, any> | null) => Record<string, any>;
