from . import BaseTestCase


class TestLicenseFunctional(BaseTestCase):

    def test_licenses_not_authenticated(self):
        self.testapp.get('/licenses', status=403)

    def test_licenses(self):
        headers = self.login_as_admin()
        self.testapp.get('/licenses', headers=headers, status=200)

    def test_license__not_authenticated(self):
        self.testapp.get('/license/%d' % 1, status=302)

    def test_license(self):
        headers = self.login_as_user1()
        self.testapp.get('/license/%d' % 1, headers=headers, status=200)

    def test_license__accept_or_reject(self):
        from osmtm.models import DBSession, User, License
        from . import USER1_ID
        headers = self.login_as_user1()
        self.testapp.post('/license/%d' % 1, headers=headers,
                          params={
                              'accepted_terms': 'I AGREE'
                          },
                          status=302)

        user = DBSession.query(User).get(USER1_ID)
        license = DBSession.query(License).get(1)
        self.assertTrue(license in user.accepted_licenses)

        self.testapp.post('/license/1', headers=headers,
                          params={
                              'accepted_terms': 'blah'
                          },
                          status=302)
        user = DBSession.query(User).get(USER1_ID)
        self.assertFalse(license in user.accepted_licenses)

    def test_license_new__forbidden(self):
        self.testapp.get('/license/new', status=403)

        headers = self.login_as_user1()
        self.testapp.get('/license/new', headers=headers, status=403)

    def test_license_new(self):
        headers = self.login_as_admin()
        self.testapp.get('/license/new', headers=headers, status=200)

    def test_license_new__submitted(self):
        from osmtm.models import DBSession, License
        headers = self.login_as_admin()
        self.testapp.post('/license/new', headers=headers,
                          params={
                              'form.submitted': True,
                              'name': 'New License',
                              'description': 'description',
                              'plain_text': 'plain_text'
                          },
                          status=302)

        self.assertEqual(DBSession.query(License).count(), 2)

    def test_license_edit__forbidden(self):
        self.testapp.get('/license/1/edit', status=403)

        headers = self.login_as_user1()
        self.testapp.get('/license/1/edit', headers=headers, status=403)

    def test_license_edit(self):
        headers = self.login_as_admin()
        self.testapp.get('/license/1/edit', headers=headers, status=200)

    def test_license_edit__submitted(self):
        from osmtm.models import DBSession, License
        headers = self.login_as_admin()
        self.testapp.post('/license/1/edit', headers=headers,
                          params={
                              'form.submitted': True,
                              'name': 'changed_name',
                              'description': 'changed_description',
                              'plain_text': 'changed_plain_text'
                          },
                          status=302)

        self.assertEqual(DBSession.query(License).get(1).name, u'changed_name')

    def test_license_delete__forbidden(self):
        self.testapp.get('/license/1/delete', status=403)

        headers = self.login_as_user1()
        self.testapp.get('/license/1/delete', headers=headers, status=403)

    def test_license_delete(self):
        import transaction
        from osmtm.models import DBSession, License
        license = License()
        DBSession.add(license)
        DBSession.flush()
        license_id = license.id
        transaction.commit()

        headers = self.login_as_admin()
        self.testapp.get('/license/%d/delete' % license_id,
                         headers=headers, status=302)

        self.assertEqual(DBSession.query(License).count(), 1)

    def test_license_delete__doesnt_exist(self):
        headers = self.login_as_admin()
        self.testapp.get('/license/999/delete', headers=headers, status=302)
