import { sanitiseFileName } from '../../utils';

export function derivePdfFileNameFromText(lines: string[]): string {
  // Picks the first "meaningful" line as a title (simple heuristic).
  const firstMeaningfulLine = lines.map(l => l.trim()).find(l => l.length > 5);

  if (!firstMeaningfulLine) {
    throw new Error('Could not derive filename from PDF text.');
  }

  return `${sanitiseFileName(firstMeaningfulLine)}.pdf`;
}
