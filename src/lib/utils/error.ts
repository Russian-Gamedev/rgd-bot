/** Formats an unknown error as a string, preferring the stack for Error instances. */
export function formatError(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}

/** Extracts a human-readable message from an unknown error. */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
