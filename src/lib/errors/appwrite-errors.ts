export class AppwriteError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
    this.name = "AppwriteError";
  }
}

export class AppwriteErrorHandler {
  static handle(error: unknown): AppwriteError {
    console.log("error in AppwriteErrorHandler: ", error);
    if (error instanceof AppwriteError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.message.includes("Document not found")) {
        return new AppwriteError(
          "Resource not found",
          "DOCUMENT_NOT_FOUND",
          404
        );
      }

      if (error.message.includes("Unauthorized")) {
        return new AppwriteError("Unauthorized access", "UNAUTHORIZED", 401);
      }

      if (error.message.includes("Forbidden")) {
        return new AppwriteError("Forbidden access", "FORBIDDEN", 403);
      }

      if (error.message.includes("Invalid query")) {
        return new AppwriteError(
          "Invalid query parameters",
          "INVALID_QUERY",
          400
        );
      }
    }

    return new AppwriteError(
      `Internal server error, (${error})`,
      "INTERNAL_ERROR",
      500
    );
  }
}
