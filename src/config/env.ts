import { requireEnv } from './requireEnv';

export const ENV = {
  GOOGLE_SERVICE_ACCOUNT_JSON: requireEnv('GOOGLE_SERVICE_ACCOUNT_JSON'),
} as const;
