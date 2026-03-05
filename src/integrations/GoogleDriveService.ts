import { google, type drive_v3 } from 'googleapis';
import { GoogleServiceAccountAuthService } from './GoogleServiceAccountAuthService';

export class GoogleDriveService {
  private authService: GoogleServiceAccountAuthService;
  private drive?: drive_v3.Drive;

  constructor(authService: GoogleServiceAccountAuthService) {
    this.authService = authService;
  }

  /**
   * Lists non-trashed files within a specific Google Drive folder.
   * Returns basic metadata (id, name, mimeType).
   */
  public async listFilesInFolder(folderId: string, pageSize = 1000) {
    const drive = this.getDrive();

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize, // max allowed is 1000
    });

    return res.data.files || [];
  }

  /**
   * Checks whether a file with a given name exists inside a specific folder.
   * Returns true if at least one match is found.
   */
  public async fileExistsInFolder(
    fileName: string,
    folderId: string
  ): Promise<boolean> {
    const drive = this.getDrive();

    const res = await drive.files.list({
      q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
      fields: 'files(id)',
      pageSize: 1, // we only need to know if one match exists
    });

    return (res.data.files?.length ?? 0) > 0;
  }

  /**
   * Retrieves the file ID for a file with a given name inside a folder.
   * Returns null if no matching file is found.
   */
  public async getFileIdByName(
    fileName: string,
    folderId: string
  ): Promise<string | null> {
    const drive = this.getDrive();

    const res = await drive.files.list({
      q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
      fields: 'files(id)',
      pageSize: 1,
    });

    const file = res.data.files?.[0];
    return file?.id ?? null;
  }

  /**
   * Downloads a file from Google Drive and returns its contents as a Buffer.
   * Uses streaming to efficiently handle large files.
   */
  public async downloadFileAsBuffer(fileId: string): Promise<Buffer> {
    const drive = this.getDrive();

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const chunks: Uint8Array[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      response.data
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', err => reject(err));
    });
  }

  /**
   * Moves a file from one folder to another.
   * Optionally renames the file during the move operation.
   */
  public async moveFileToFolder(
    fileId: string,
    currentParentId: string, // explicitly specifying the current parent folder ID is best practice for safety and precision
    targetFolderId: string,
    newName?: string // optional parameter for renaming
  ): Promise<void> {
    const drive = this.getDrive();

    await drive.files.update({
      fileId,
      addParents: targetFolderId,
      removeParents: currentParentId,
      requestBody: newName ? { name: newName } : {},
      fields: 'id, name, parents',
    });
  }

  /**
   * Lazily initializes and returns an authenticated Google Drive client.
   * Reuses the client instance for subsequent calls.
   */
  private getDrive() {
    if (!this.drive) {
      const auth = this.authService.getAuthenticatedGoogleClient([
        'https://www.googleapis.com/auth/drive', // full access
      ]);

      this.drive = google.drive({ version: 'v3', auth });
    }

    return this.drive;
  }
}
