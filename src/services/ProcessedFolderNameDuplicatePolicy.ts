import { GoogleDriveService } from '../integrations';
import {
  PdfDuplicateDetectionPolicy,
  PdfFoldersConfig,
} from './PdfProcessingService';

export class ProcessedFolderNameDuplicatePolicy implements PdfDuplicateDetectionPolicy {
  async isDuplicate({
    candidateName,
    folders,
    googleDriveService,
  }: {
    candidateName: string;
    folders: PdfFoldersConfig;
    googleDriveService: GoogleDriveService;
  }): Promise<boolean> {
    return googleDriveService.fileExistsInFolder(
      candidateName,
      folders.processed
    );
  }
}
