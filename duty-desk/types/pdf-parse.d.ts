declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: any;
  }
  function pdfParse(data: Buffer | Uint8Array): Promise<PdfParseResult>;
  export = pdfParse;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: any;
  }
  function pdfParse(data: Buffer | Uint8Array): Promise<PdfParseResult>;
  export = pdfParse;
}
