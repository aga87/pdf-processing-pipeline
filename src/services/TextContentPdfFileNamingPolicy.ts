import { PdfFileNamingPolicy } from './PdfProcessingService';

import { derivePdfFileNameFromText } from '../libs';

export class TextContentPdfFileNamingPolicy implements PdfFileNamingPolicy {
  determineFileName({
    originalName,
    lines,
  }: {
    originalName: string;
    lines?: string[];
  }): string {
    if (!lines) {
      return originalName;
    }

    return derivePdfFileNameFromText(lines);
  }
}
