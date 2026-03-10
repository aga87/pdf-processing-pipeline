import { ENV } from '../config';
import {
  GoogleCloudTasksService,
  GoogleDriveService,
  GoogleServiceAccountAuthService,
} from '../integrations';
import {
  PdfProcessingService,
  PdfProcessingTaskEnqueuer,
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

const googleCloudTasksService = new GoogleCloudTasksService(
  ENV.config.cloudTasks
);

export const pdfProcessingTaskEnqueuer = new PdfProcessingTaskEnqueuer(
  googleDriveService,
  googleCloudTasksService,
  ENV.config.pdfFolders,
  ENV.config.cloudRun.pdfProcessingWorkerUrl
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
