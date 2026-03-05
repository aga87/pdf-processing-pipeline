import { google } from 'googleapis';
import { HttpError } from '../models';
import { logger } from '../logging';

export class GoogleServiceAccountAuthService {
  constructor(private readonly googleServiceAccountRawJson: string) {}

  public getAuthenticatedGoogleClient(scopes: string[]) {
    try {
      const credentials = JSON.parse(this.googleServiceAccountRawJson);

      return new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes,
      });
    } catch (err: unknown) {
      const ERROR_MSG =
        'Failed to load service account credentials from secret.';
      logger.error(ERROR_MSG, { err });
      throw new HttpError(ERROR_MSG, 500);
    }
  }
}
