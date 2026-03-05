import { ENV } from '../config';
import {
  GoogleDriveService,
  GoogleServiceAccountAuthService,
} from '../integrations';
import {
  PdfProcessingService,
  TextContentPdfFileNamingPolicy,
} from '../services';

const googleServiceAccountAuthService = new GoogleServiceAccountAuthService(
  ENV.GOOGLE_SERVICE_ACCOUNT_JSON
);

const googleDriveService = new GoogleDriveService(
  googleServiceAccountAuthService
);

const namingPolicy = new TextContentPdfFileNamingPolicy();

export const pdfProcessingService = new PdfProcessingService(
  googleDriveService,
  ENV.PDF_FOLDERS_CONFIG,
  namingPolicy
);
