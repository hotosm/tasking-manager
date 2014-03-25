from . import BaseTestCase

class TestViewsFunctional(BaseTestCase):

    def test_users(self):
        self.testapp.get('/users', status=200)

    def test_user_messages_not_authenticated(self):
        self.testapp.get('/user/messages', status=302)

    def test_user_messages(self):

        headers = self.remember(self.foo_user_id)
        try:
            res = self.testapp.get('/user/messages', headers=headers, status=200)
        finally:
            self.forget()

    def test_user_admin_logged_in_as_admin(self):

        from osmtm.models import User, DBSession
        import transaction

        userid = 3
        username = u'dude_user'
        user = User(userid, username, False)
        DBSession.add(user)
        DBSession.flush()
        transaction.commit()

        headers = self.remember(self.admin_user_id)
        try:
            res = self.testapp.get('/user/%d/admin' % userid, headers=headers, status=302)
            res2 = res.follow(headers=headers, status=200)
            self.failUnless('dude_user' in res2.body)
            self.failUnless('This user is an administrator' in res2.body)
        finally:
            self.forget()

        DBSession.delete(user)
        transaction.commit()

    def test_user(self):

        res = self.testapp.get('/user/foo_user', status=200)
        self.failUnless('foo_user' in res.body)
