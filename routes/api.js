'use strict';

module.exports = function (app) {
  const issues = {};

  // POST request to create a new issue
  app.post('/api/issues/:project', (req, res) => {
    const project = req.params.project;

    const { issue_title, issue_text, created_by, assigned_to = '', status_text = '' } = req.body;

    if (!issue_title || !issue_text || !created_by) {
      return res.json({ error: 'required field(s) missing' });
    }

    const newIssue = {
      _id: Math.random().toString(36).substr(2, 9),
      issue_title,
      issue_text,
      created_by,
      assigned_to,
      status_text,
      created_on: new Date(),
      updated_on: new Date(),
      open: true,
    };

    if (!issues[project]) issues[project] = [];
    issues[project].push(newIssue);

    res.json(newIssue);
  });

  // GET request to view issues on a project
  app.get('/api/issues/:project', (req, res) => {
    const project = req.params.project;
    const filters = req.query;

    if (!issues[project]) {
      return res.json([]);
    }

    let filteredIssues = issues[project];

    for (let key in filters) {
      filteredIssues = filteredIssues.filter(issue => String(issue[key]) === filters[key]);
    }

    res.json(filteredIssues);
  });

  // PUT request to update an issue
  app.put('/api/issues/:project', (req, res) => {
    const project = req.params.project;
    const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
  
    // Проверка на отсутствие _id
    if (!_id) {
      return res.json({ error: 'missing _id' });
    }
  
    // Проверка на отсутствие полей для обновления
    if (!issue_title && !issue_text && !created_by && !assigned_to && !status_text && open === undefined) {
      return res.json({ error: 'no update field(s) sent', _id });
    }
  
    if (!issues[project]) {
      return res.json({ error: 'could not update', _id });
    }
  
    const issueIndex = issues[project].findIndex(issue => issue._id === _id);
  
    if (issueIndex === -1) {
      return res.json({ error: 'could not update', _id });
    }
  
    const issue = issues[project][issueIndex];
  
    // Обновляем только те поля, которые были переданы
    if (issue_title) issue.issue_title = issue_title;
    if (issue_text) issue.issue_text = issue_text;
    if (created_by) issue.created_by = created_by;
    if (assigned_to) issue.assigned_to = assigned_to;
    if (status_text) issue.status_text = status_text;
    if (open !== undefined) issue.open = open;
  
    issue.updated_on = new Date();
    issues[project][issueIndex] = issue;
  
    res.json({ result: 'successfully updated', _id });
  });
  // DELETE request to delete an issue
  app.delete('/api/issues/:project', (req, res) => {
    const project = req.params.project;
    const { _id } = req.body;

    if (!_id) {
      return res.json({ error: 'missing _id' });
    }

    if (!issues[project]) {
      return res.json({ error: 'could not delete', _id });
    }

    const issueIndex = issues[project].findIndex(issue => issue._id === _id);

    if (issueIndex === -1) {
      return res.json({ error: 'could not delete', _id });
    }

    issues[project].splice(issueIndex, 1);
    res.json({ result: 'successfully deleted', _id });
  });
};