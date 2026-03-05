import { ENV } from '../config';
import {
  GoogleDriveService,
  GoogleServiceAccountAuthService,
} from '../integrations';
import {
  PdfProcessingService,
  ProcessedFolderNameDuplicatePolicy,
  TextContentPdfFileNamingPolicy,
} from '../services';

const googleServiceAccountAuthService = new GoogleServiceAccountAuthService(
  ENV.GOOGLE_SERVICE_ACCOUNT_JSON
);

const googleDriveService = new GoogleDriveService(
  googleServiceAccountAuthService
);

const namingPolicy = new TextContentPdfFileNamingPolicy();
const duplicatePolicy = new ProcessedFolderNameDuplicatePolicy();

export const pdfProcessingService = new PdfProcessingService(
  googleDriveService,
  ENV.PDF_FOLDERS_CONFIG,
  namingPolicy,
  duplicatePolicy
);
