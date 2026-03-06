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
  ENV.secrets.googleServiceAccountJson
);

const googleDriveService = new GoogleDriveService(
  googleServiceAccountAuthService
);

const namingPolicy = new TextContentPdfFileNamingPolicy();
const duplicatePolicy = new ProcessedFolderNameDuplicatePolicy();
const duplicateNamingPolicy = new TimestampDuplicateNamingPolicy();

export const pdfProcessingService = new PdfProcessingService(
  googleDriveService,
  ENV.config.pdfFolders,
  namingPolicy,
  duplicatePolicy,
  duplicateNamingPolicy
);
