// https://www.npmjs.com/package/pdf-parse
import { PDFParse } from 'pdf-parse';

export async function parsePdf(buffer: Buffer): Promise<string[]> {
  const parser = new PDFParse({ data: buffer });

  const result = await parser.getText();
  await parser.destroy();

  return (result.text ?? '').split(/\r?\n/);
}
