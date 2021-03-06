const express = require('express');
const router = express.Router();
const controller = require('../controller').project;

router.route('/:id')
    .get(controller.getProject)
    .post(controller.saveProject);

router.route('/:id/screens/dir')
    .get(controller.showProjectScreensDir)
    .post(controller.navigateProjectScreensDir)
    .put(controller.saveProjectSceenDir)

router.route('/:id/delete')
    .post(controller.deleteProject);

router.route('/:id/objects')
    .get(controller.getProjectObjects)

router.route('/:id/objects/create')
    .post(controller.createProjectObjects);

router.route('/:id/database')
    .get(controller.getProjectDB)
    .post(controller.saveProjectDB);

router.route('/:id/export')
    .get(controller.getProjectExport)
    .post(controller.pushProjectExport);

module.exports = router;