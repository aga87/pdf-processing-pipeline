import { ENV } from '../config';
import {
  GoogleDriveService,
  GoogleServiceAccountAuthService,
} from '../integrations';

const googleServiceAccountAuthService = new GoogleServiceAccountAuthService(
  ENV.GOOGLE_SERVICE_ACCOUNT_JSON
);

const googleDriveService = new GoogleDriveService(
  googleServiceAccountAuthService
);
