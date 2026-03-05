import { ENV } from '../config';
import {
  GoogleDriveService,
  GoogleServiceAccountAuthService,
} from '../integrations';
import {
  PdfProcessingService,
  ProcessedFolderNameDuplicatePolicy,
  TextContentPdfFileNamingPolicy,
  TimestampDuplicateNamingPolicy,
} from '../services';

const googleServiceAccountAuthService = new GoogleServiceAccountAuthService(
  ENV.GOOGLE_SERVICE_ACCOUNT_JSON
);

const googleDriveService = new GoogleDriveService(
  googleServiceAccountAuthService
);

const namingPolicy = new TextContentPdfFileNamingPolicy();
const duplicatePolicy = new ProcessedFolderNameDuplicatePolicy();
const duplicateNamingPolicy = new TimestampDuplicateNamingPolicy();

export const pdfProcessingService = new PdfProcessingService(
  googleDriveService,
  ENV.PDF_FOLDERS_CONFIG,
  namingPolicy,
  duplicatePolicy,
  duplicateNamingPolicy
);
