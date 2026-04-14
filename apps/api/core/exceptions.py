class DomainException(Exception):
    pass

class InvalidCredentialsError(DomainException):
    def __init__(self, message: str = "Email or password incorrect"):
        self.message = message
        super().__init__(self.message)

class UserAlreadyExistsError(DomainException):
    def __init__(self, message: str = "Email already registered"):
        self.message = message
        super().__init__(self.message)
