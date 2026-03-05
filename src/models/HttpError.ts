export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, HttpError.prototype); // Fix prototype chain so that an HttpError can be instanceof Error
  }
}

export const getHttpErrorStatusCode = (err: unknown): number => {
  if (err instanceof HttpError) return err.statusCode;

  // Treat all network or unknown errors as 500 since the frontend only needs to know it's a server failure
  return 500;
};

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;

  if (typeof err === 'string') return err;

  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown error';
  }
};
