const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let updateIssueId; // Для хранения _id задачи для тестов обновления
  let deleteIssueId; // Для хранения _id задачи для тестов удаления

  // 1. Create an issue with every field: POST request to /api/issues/{project}
  test('Create an issue with every field', function(done) {
    chai.request(server)
      .post('/api/issues/testproject')
      .send({
        issue_title: 'Test Title',
        issue_text: 'Test Text',
        created_by: 'Test Creator',
        assigned_to: 'Test Assignee',
        status_text: 'In Progress'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Test Title');
        assert.equal(res.body.issue_text, 'Test Text');
        assert.equal(res.body.created_by, 'Test Creator');
        assert.equal(res.body.assigned_to, 'Test Assignee');
        assert.equal(res.body.status_text, 'In Progress');
        assert.isTrue(res.body.open);
        assert.exists(res.body._id);
        updateIssueId = res.body._id; // Сохраняем _id для тестов обновления
        done();
      });
  });

  // 2. Create an issue with only required fields: POST request to /api/issues/{project}
  test('Create an issue with only required fields', function(done) {
    chai.request(server)
      .post('/api/issues/testproject')
      .send({
        issue_title: 'Required Title',
        issue_text: 'Required Text',
        created_by: 'Required Creator'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Required Title');
        assert.equal(res.body.issue_text, 'Required Text');
        assert.equal(res.body.created_by, 'Required Creator');
        assert.equal(res.body.assigned_to, ''); // Пустое поле
        assert.equal(res.body.status_text, ''); // Пустое поле
        assert.isTrue(res.body.open);
        assert.exists(res.body._id);
        done();
      });
  });

  // 3. Create an issue with missing required fields: POST request to /api/issues/{project}
  test('Create an issue with missing required fields', function(done) {
    chai.request(server)
      .post('/api/issues/testproject')
      .send({
        issue_title: '',
        issue_text: '',
        created_by: ''
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'required field(s) missing');
        done();
      });
  });

  // 4. View issues on a project: GET request to /api/issues/{project}
  test('View issues on a project', function(done) {
    chai.request(server)
      .get('/api/issues/testproject')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        if (res.body.length > 0) {
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], '_id');
        }
        done();
      });
  });

  // 5. View issues on a project with one filter: GET request to /api/issues/{project}
  test('View issues on a project with one filter', function(done) {
    chai.request(server)
      .get('/api/issues/testproject')
      .query({ open: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.isTrue(issue.open);
        });
        done();
      });
  });

  // 6. View issues on a project with multiple filters: GET request to /api/issues/{project}
  test('View issues on a project with multiple filters', function(done) {
    chai.request(server)
      .get('/api/issues/testproject')
      .query({ open: true, created_by: 'Test Creator' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.isTrue(issue.open);
          assert.equal(issue.created_by, 'Test Creator');
        });
        done();
      });
  });

  // 7. Update one field on an issue: PUT request to /api/issues/{project}
  test('Update one field on an issue', function(done) {
    chai.request(server)
      .put('/api/issues/testproject')
      .send({ _id: updateIssueId, issue_text: 'Updated Text' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully updated');
        assert.equal(res.body._id, updateIssueId);
        done();
      });
  });

  // 8. Update multiple fields on an issue: PUT request to /api/issues/{project}
  test('Update multiple fields on an issue', function(done) {
    chai.request(server)
      .put('/api/issues/testproject')
      .send({ _id: updateIssueId, issue_title: 'Updated Title', issue_text: 'Updated Text' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully updated');
        assert.equal(res.body._id, updateIssueId);
        done();
      });
  });

  // 9. Update an issue with missing _id: PUT request to /api/issues/{project}
  test('Update an issue with missing _id', function(done) {
    chai.request(server)
      .put('/api/issues/testproject')
      .send({ issue_text: 'Updated Text' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'missing _id');
        done();
      });
  });

  // 10. Update an issue with no fields to update: PUT request to /api/issues/{project}
  test('Update an issue with no fields to update', function(done) {
    chai.request(server)
      .put('/api/issues/testproject')
      .send({ _id: updateIssueId }) // Отправляем только _id, но не остальные поля
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'no update field(s) sent');
        assert.equal(res.body._id, updateIssueId);
        done();
      });
  });

  // 11. Update an issue with an invalid _id: PUT request to /api/issues/{project}
  test('Update an issue with an invalid _id', function(done) {
    chai.request(server)
      .put('/api/issues/testproject')
      .send({ _id: 'invalid_id', issue_text: 'Updated Text' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'could not update');
        assert.equal(res.body._id, 'invalid_id');
        done();
      });
  });

  // Создаем задачу для удаления
  test('Create an issue to delete later', function(done) {
    chai.request(server)
      .post('/api/issues/testproject')
      .send({
        issue_title: 'Delete Title',
        issue_text: 'Delete Text',
        created_by: 'Delete Creator'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        deleteIssueId = res.body._id; // Сохраняем _id для удаления
        done();
      });
  });

  // 12. Delete an issue: DELETE request to /api/issues/{project}
  test('Delete an issue', function(done) {
    chai.request(server)
      .delete('/api/issues/testproject')
      .send({ _id: deleteIssueId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully deleted');
        assert.equal(res.body._id, deleteIssueId);
        done();
      });
  });

  // 13. Delete an issue with an invalid _id: DELETE request to /api/issues/{project}
  test('Delete an issue with an invalid _id', function(done) {
    chai.request(server)
      .delete('/api/issues/testproject')
      .send({ _id: 'invalid_id' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'could not delete');
        assert.equal(res.body._id, 'invalid_id');
        done();
      });
  });

  // 14. Delete an issue with missing _id: DELETE request to /api/issues/{project}
  test('Delete an issue with missing _id', function(done) {
    chai.request(server)
      .delete('/api/issues/testproject')
      .send({})
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, 'missing _id');
        done();
      });
  });

});