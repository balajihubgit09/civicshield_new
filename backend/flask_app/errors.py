class AppError(Exception):
    def __init__(self, message, status_code=500, code="INTERNAL_SERVER_ERROR", details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details
