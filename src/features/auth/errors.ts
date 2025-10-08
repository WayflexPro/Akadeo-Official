export function resolveApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    if (err.server) {
      const payload = err.payload as { error?: { message?: string } } | string | undefined;
      if (payload && typeof payload === "object" && "error" in payload) {
        const errorPayload = (payload as { error?: { message?: string } }).error;
        if (errorPayload?.message) {
          return errorPayload.message;
        }
      }

      if (typeof err.message === "string" && err.message) {
        return err.message;
      }

      return fallback;
    }

    if (err.timeout || err.name === "AbortError") {
      return "Timeout";
    }

    if (typeof err.classification === "string" && err.classification === "FRONTEND") {
      if (typeof err.message === "string" && err.message.toLowerCase().includes("invalid server response")) {
        return "Invalid server response";
      }

      return "Network error";
    }
  }

  if (error instanceof Error) {
    const message = error.message || "";
    if (message.toLowerCase().includes("timeout")) {
      return "Timeout";
    }
    if (message.toLowerCase().includes("invalid server response")) {
      return "Invalid server response";
    }
  }

  return fallback;
}
