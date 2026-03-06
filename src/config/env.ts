import type { PdfFoldersConfig } from '../services';
import { requireEnv } from './requireEnv';

export const ENV = {
  config: {
    pdfFolders: {
      toProcess: requireEnv('PDFS_TO_PROCESS_FOLDER_ID'),
      processed: requireEnv('PDFS_PROCESSED_FOLDER_ID'),
      duplicates: requireEnv('PDFS_DUPLICATES_FOLDER_ID'),
      failed: requireEnv('PDFS_FAILED_FOLDER_ID'),
    } satisfies PdfFoldersConfig,
  },

  secrets: {
    googleServiceAccountJson: requireEnv('GOOGLE_SERVICE_ACCOUNT_JSON'),
  },
} as const;
