class ErrorCode:
    """Structured error codes for the application."""
    DUPLICATE_ITEM = "DUPLICATE_ITEM"
    CONFLICT_ITEM = "CONFLICT_ITEM"
    NOT_FOUND = "NOT_FOUND"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTH_ERROR = "AUTH_ERROR"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    CARD_LIMIT_EXCEEDED = "CARD_LIMIT_EXCEEDED"
    INSUFFICIENT_BUDGET = "INSUFFICIENT_BUDGET"


class DomainException(Exception):
    def __init__(self, message: str, code: str = ErrorCode.NOT_FOUND):
        self.message = message
        self.code = code
        super().__init__(message)


class AuthenticationError(DomainException):
    def __init__(self, message: str = "Email or password incorrect"):
        super().__init__(message, ErrorCode.AUTH_ERROR)


class UserAlreadyExistsError(DomainException):
    def __init__(self, message: str = "Email already registered"):
        super().__init__(message, ErrorCode.DUPLICATE_ITEM)