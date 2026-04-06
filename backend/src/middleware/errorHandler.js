export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(error, req, res, next) {
  if (error.message === "CORS_NOT_ALLOWED") {
    return res.status(403).json({
      error: "CORS_NOT_ALLOWED",
      message: "Origin is not allowed to access this resource."
    });
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    error: error.code || "INTERNAL_SERVER_ERROR",
    message: error.message || "Unexpected server error"
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}
