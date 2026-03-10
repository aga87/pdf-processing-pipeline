import { GoogleDriveService } from '../integrations';
import { getHttpErrorStatusCode, getErrorMessage } from '../models';
import { parsePdf } from '../libs';
import { debugLog, logger } from '../logging';

export interface PdfFoldersConfig {
  toProcess: string;
  processed: string;
  duplicates: string;
  failed: string;
}

export interface PdfFileNamingPolicy {
  determineFileName(context: {
    originalName: string;
    lines?: string[];
    buffer?: Buffer;
    metadata?: Record<string, unknown>;
  }): string;
}

export interface PdfDuplicateDetectionPolicy {
  isDuplicate(context: {
    candidateName: string;
    folders: PdfFoldersConfig;
    googleDriveService: GoogleDriveService;
  }): Promise<boolean>;
}

export interface PdfDuplicateNamingPolicy {
  determineDuplicateFileName(context: {
    preferredName: string; // usually the derived newName
    originalName: string;
    now?: Date; // for testability
  }): string;
}

export class PdfProcessingService {
  constructor(
    private googleDriveService: GoogleDriveService,
    private folders: PdfFoldersConfig,
    private namingPolicy: PdfFileNamingPolicy,
    private duplicatePolicy: PdfDuplicateDetectionPolicy,
    private duplicateNamingPolicy: PdfDuplicateNamingPolicy
  ) {}

  /** End-to-end processing for a single PDF: download → parse → derive title → rename → move to processed/duplicates/failed. */
  public async processPdf(fileId: string): Promise<void> {
    const metadata = await this.googleDriveService.getFileMetadata(fileId);

    if (!metadata) {
      logger.warn(`Could not retrieve metadata for fileId: ${fileId}`);
      return;
    }

    if (metadata.mimeType !== 'application/pdf') {
      logger.warn(`Skipping non-PDF file: ${metadata.name}`);
      return;
    }

    const { name: fileName } = metadata;

    debugLog(`Processing PDF: ${fileName} (id: ${fileId})`);

    try {
      debugLog(`Downloading PDF ${fileId}...`);
      const buffer = await this.googleDriveService.downloadFileAsBuffer(fileId);

      debugLog('Parsing PDF text...');
      /**
       * A real PDF must start with:
        - header containing %PDF-
        - hex starting with 255044462d
       */
      debugLog('header:', buffer.subarray(0, 16).toString('utf8'));
      debugLog('hex:', buffer.subarray(0, 8).toString('hex'));
      const lines = await parsePdf(buffer);

      debugLog(
        'Extracting title from PDF text and creating a safe filename...'
      );

      const newName = this.namingPolicy.determineFileName({
        originalName: fileName,
        lines,
      });

      const isDuplicate = await this.duplicatePolicy.isDuplicate({
        candidateName: newName,
        folders: this.folders,
        googleDriveService: this.googleDriveService,
      });

      if (isDuplicate) {
        debugLog(`Duplicate detected → moving to duplicates: ${newName}`);
        await this.moveToDuplicates(fileId, fileName, newName);
        return;
      }

      debugLog(`Renaming PDF and moving to processed as: ${newName}`);
      await this.googleDriveService.moveFileToFolder(
        fileId,
        this.folders.toProcess,
        this.folders.processed,
        newName
      );

      logger.info(`Processed PDF: ${fileName} → ${newName}`);
    } catch (err: unknown) {
      const statusCode = getHttpErrorStatusCode(err);
      const msg = getErrorMessage(err);
      const stack = err instanceof Error ? err.stack : null;

      logger.error(
        `Error ${statusCode} processing PDF: ${fileName} - ${msg} - ${stack}`
      );

      // Best-effort: move to failed (keep original name)
      try {
        await this.googleDriveService.moveFileToFolder(
          fileId,
          this.folders.toProcess,
          this.folders.failed,
          fileName
        );
      } catch (moveErr: unknown) {
        logger.error(
          `Failed to move PDF to failed folder: ${fileName} - ${getErrorMessage(
            moveErr
          )}`
        );
      }
    }
  }

  // Moves duplicates to the duplicates folder, ensuring the filename stays unique.
  private async moveToDuplicates(
    fileId: string,
    originalName: string,
    preferredName: string
  ) {
    const uniqueName = this.duplicateNamingPolicy.determineDuplicateFileName({
      preferredName,
      originalName,
    });

    await this.googleDriveService.moveFileToFolder(
      fileId,
      this.folders.toProcess,
      this.folders.duplicates,
      uniqueName
    );
  }
}
