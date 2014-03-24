from . import BaseTestCase

class TestHomeFunctional(BaseTestCase):

    def test_authenticated(self):

        headers = self.remember(self.admin_user_id)
        try:
            res = self.testapp.get('/', headers=headers, status=200)
        finally:
            self.forget()
        self.failUnless('admin_user' in res.body)
