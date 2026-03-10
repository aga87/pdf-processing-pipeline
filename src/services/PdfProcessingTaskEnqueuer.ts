import { logger } from '../logging';
import { partitionSettledWithContext } from '../utils';
import { GoogleDriveService, GoogleCloudTasksService } from '../integrations';
import { PdfFoldersConfig } from './PdfProcessingService';

export class PdfProcessingTaskEnqueuer {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly cloudTasksService: GoogleCloudTasksService,
    private readonly folders: PdfFoldersConfig,
    private readonly workerUrl: string
  ) {}

  public async enqueuePdfs(batchSize = 50): Promise<void> {
    const files = await this.googleDriveService.listFilesInFolder(
      this.folders.toProcess,
      batchSize
    );

    const fileIds = files.map(file => file.id).flatMap(id => (id ? [id] : []));

    logger.info('Starting Cloud Tasks enqueue for PDF processing', {
      fileCount: fileIds.length,
      folderId: this.folders.toProcess,
    });

    const results = await Promise.allSettled(
      fileIds.map(fileId =>
        this.cloudTasksService.enqueueHttpTask({
          url: this.workerUrl,
          body: { fileId },
        })
      )
    );

    const { fulfilled, rejected } = partitionSettledWithContext(
      fileIds,
      results
    );

    if (fulfilled.length > 0) {
      logger.info('Cloud Tasks successfully enqueued', {
        fileIds: fulfilled,
      });
    }

    if (rejected.length > 0) {
      logger.warn('Cloud Tasks enqueue failures', {
        failures: rejected.map(r => ({
          fileId: r.context,
          error: r.error instanceof Error ? r.error.message : r.error,
        })),
      });
    }
  }
}
