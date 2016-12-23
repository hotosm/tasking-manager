from . import BaseTestCase


class TestLabelFunctional(BaseTestCase):

    def test_labels_not_authenticated(self):
        self.testapp.get('/labels', status=403)

    def test_labels(self):
        headers = self.login_as_admin()
        self.testapp.get('/labels', headers=headers, status=200)

    def test_label_new__forbidden(self):
        self.testapp.get('/label/new', status=403)

        headers = self.login_as_user1()
        self.testapp.get('/label/new', headers=headers, status=403)

    def test_label_new(self):
        headers = self.login_as_admin()
        self.testapp.get('/label/new', headers=headers, status=200)

    def test_label_new__submitted(self):
        from osmtm.models import DBSession, Label
        headers = self.login_as_admin()
        self.testapp.post('/label/new', headers=headers,
                          params={
                              'form.submitted': True,
                              'name': 'Name',
                              'color': '#ff0000',
                          },
                          status=302)

        self.assertEqual(DBSession.query(Label).count(), 3)

    def test_label_edit__forbidden(self):
        self.testapp.get('/label/1/edit', status=403)

        headers = self.login_as_user1()
        self.testapp.get('/label/1/edit', headers=headers, status=403)

    def test_label_edit(self):
        headers = self.login_as_admin()
        self.testapp.get('/label/1/edit', headers=headers, status=200)

    def test_label_edit__submitted(self):
        import transaction
        from osmtm.models import DBSession, Label
        headers = self.login_as_admin()

        label = Label()
        label.name = 'some name'
        DBSession.add(label)
        DBSession.flush()
        label_id = label.id
        transaction.commit()

        self.testapp.post('/label/%s/edit' % label_id, headers=headers,
                          params={
                              'form.submitted': True,
                              'name': 'changed_name',
                              'color': '#ff0000',
                          },
                          status=302)

        self.assertEqual(DBSession.query(Label).get(label_id).name,
                         u'changed_name')
        DBSession.delete(label)
        transaction.commit()

    def test_label_delete__forbidden(self):
        self.testapp.get('/label/3/delete', status=403)

        headers = self.login_as_user1()
        self.testapp.get('/label/3/delete', headers=headers, status=403)

    def test_label_delete(self):
        import transaction
        from osmtm.models import DBSession, Label
        label = Label()
        label.name = 'some name'
        DBSession.add(label)
        DBSession.flush()
        label_id = label.id
        transaction.commit()

        headers = self.login_as_admin()
        self.testapp.get('/label/%d/delete' % label_id,
                         headers=headers, status=302)

        self.assertEqual(DBSession.query(Label).count(), 2)

    def test_label_delete__doesnt_exist(self):
        headers = self.login_as_admin()
        self.testapp.get('/label/999/delete', headers=headers, status=302)
