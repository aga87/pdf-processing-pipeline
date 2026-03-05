import { PdfDuplicateNamingPolicy } from './PdfProcessingService';

export class TimestampDuplicateNamingPolicy implements PdfDuplicateNamingPolicy {
  determineDuplicateFileName({
    preferredName,
    now,
  }: {
    preferredName: string;
    originalName: string;
    now?: Date;
  }): string {
    const nameWithoutExt = preferredName.replace(/\.pdf$/i, '');
    const ts = (now ?? new Date()).getTime();
    return `${nameWithoutExt}-duplicate-${ts}.pdf`;
  }
}
