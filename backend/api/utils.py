from functools import wraps
from datetime import date, datetime


class TMAPIDecorators:
    """Class for Tasking Manager custom API decorators"""

    is_pm_only_resource = None
    authenticated_user_id = (
        None  # Set by AuthenticationService when user has successfully authenticated
    )

    def pm_only(self, pm_only_resource=True):
        """
        Indicates that users must have at least Project Manager role to access the resource
        :param pm_only_resource: Sets to True for PM only resources
        """

        def pm_only_decorator(func):
            @wraps(func)
            def decorated_function(*args, **kwargs):
                self.is_pm_only_resource = pm_only_resource
                return func(*args, **kwargs)

            return decorated_function

        return pm_only_decorator


def validate_date_input(input_date):
    try:
        if not isinstance(input_date, date):
            input_date = datetime.strptime(input_date, "%Y-%m-%d").date()
        return input_date
    except (TypeError, ValueError):
        raise ValueError("InvalidDateValue- Invalid date value")
