from fastapi import HTTPException

from backend import ERROR_MESSAGES


def format_sub_code(sub_code: str) -> str:
    """Formats the sub_code to be used in the error message
    ------------------------
    Parameters:
        sub_code: str
            The sub_code of the error
    ------------------------
    Returns:
        formatted_sub_code: str
            The formatted sub_code
    """
    return sub_code.replace(" ", "_").upper()


def get_message_from_sub_code(sub_code: str) -> str:
    """Returns the message for the given sub_code
    ------------------------
    Parameters:
        sub_code: str
            The sub_code of the error
    ------------------------
    Returns:
        error_message: str
            The message for the given sub_code
    """
    try:
        return ERROR_MESSAGES[sub_code]
    except KeyError:
        return sub_code


class BaseException(HTTPException):
    def __init__(self, sub_code: str, message: str, status_code: int, **kwargs):
        self.sub_code = sub_code
        self.message = message
        self.kwargs = kwargs
        detail = {
            "error": {
                "code": status_code,
                "sub_code": sub_code,
                "message": message,
                "details": kwargs,
            }
        }
        super().__init__(status_code=status_code, detail=detail)


class BadRequest(BaseException):
    def __init__(self, sub_code=None, message=None, **kwargs):
        sub_code = sub_code if sub_code else "BAD_REQUEST"
        if message is None:
            message = get_message_from_sub_code(sub_code)
        BaseException.__init__(self, sub_code, message, 400, **kwargs)


class Unauthorized(BaseException):
    def __init__(self, sub_code=None, message=None, **kwargs):
        sub_code = sub_code if sub_code else "UNAUTHORIZED"
        if message is None:
            message = get_message_from_sub_code(sub_code)
        BaseException.__init__(self, sub_code, message, 401, **kwargs)


class Forbidden(BaseException):
    def __init__(self, sub_code=None, message=None, **kwargs):
        sub_code = sub_code if sub_code else "FORBIDDEN"
        if message is None:
            message = get_message_from_sub_code(sub_code)
        BaseException.__init__(self, sub_code, message, 403, **kwargs)


class NotFound(BaseException):
    def __init__(self, sub_code=None, message=None, **kwargs):
        sub_code = sub_code if sub_code else "NOT_FOUND"
        if message is None:
            message = get_message_from_sub_code(sub_code)
        BaseException.__init__(self, sub_code, message, 404, **kwargs)


class Conflict(BaseException):
    def __init__(self, sub_code=None, message=None, **kwargs):
        sub_code = sub_code if sub_code else "CONFLICT"
        if message is None:
            message = get_message_from_sub_code(sub_code)
        BaseException.__init__(self, sub_code, message, 409, **kwargs)
