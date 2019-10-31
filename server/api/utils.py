from functools import wraps


class TMAPIDecorators:
    """ Class for Tasking Manager custom API decorators """
    is_pm_only_resource = None
    authenticated_user_id = None  # Set by AuthenticationService when user has successfully authenticated

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

    def set_authenticated_user_id(self, lock, user_id):
        """
        Set the authenticated_user_id using a mutex so the id doesn't change with concurrent
        calls of "verify_token" in AuthenticationService
        :param lock: asyncio Lock functioning as a mutex to ensure accurate user_id
        """
        await lock.acquire()
        self.authenticated_user_id = user_id

    def get_authenticated_user_id(self, lock):
        """
        Return the authenticated_user_id and unlock the mutex
        :param lock: mutex to unlock
        """
        lock.release()
        return self.authenticated_user_id
