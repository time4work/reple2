const express = require('express');
const router = express.Router();
const controller = require('../controller').project;

router.route('/:id')
    .get(controller.getProject)
    .post(controller.postProject);
    
router.route('/:id/objects')
    .get(controller.getProjectObjects)
    .post(controller.postProjectObjects);

router.route('/:id/tags')
    .get(controller.getProjectTags)
    .post(controller.postProjectTags);

router.route('/:id/export')
    .get(controller.getProjectExport)
    .post(controller.postProjectExport);

router.route('/:id/export/:log')
    .get(controller.getProjectExportLog);

router.route('/:id/database')
    .get(controller.getProjectDB)
    .post(controller.saveProjectDB);

module.exports = router;

    // app.get('/project/:id', controller.project.getProject);
    // app.post('/project/:id', controller.project.postProject); // TODO: refactor

    // app.get('/project/:id/objects', controller.project.getProjectObjects);
    // app.post('/project/:id/objects', controller.project.postProjectObjects); // TODO: refactor

    // app.get('/project/:id/tags', controller.project.getProjectTags);
    // app.post('/project/:id/tags', controller.project.postProjectTags); // TODO: refactor

    // app.get('/project/:id/export', controller.project.getProjectExport);
    // app.post('/project/:id/export', controller.project.postProjectExport); // TODO: refactor

    // app.get('/project/:id/export/:log/', controller.project.getProjectExportLog);

    // app.get('/project/:id/database', controller.project.getProjectDB);
    // app.post('/project/:id/database', controller.project.saveProjectDB);
