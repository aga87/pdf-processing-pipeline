import type { GoogleCloudTasksConfig } from '../integrations';
import type { PdfFoldersConfig } from '../services';
import { requireEnv } from './requireEnv';

export const ENV = {
  config: {
    cloudTasks: {
      projectId: requireEnv('GCP_PROJECT_ID'),
      location: requireEnv('CLOUD_TASKS_LOCATION'),
      queueName: requireEnv('CLOUD_TASKS_PDF_PROCESSING_QUEUE_NAME'),
      serviceAccountEmail: requireEnv(
        'CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL'
      ),
    } satisfies GoogleCloudTasksConfig,
    cloudRun: {
      pdfProcessingWorkerUrl: requireEnv('PDF_PROCESSING_WORKER_URL'),
    },
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
