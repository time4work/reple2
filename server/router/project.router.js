const express = require('express');
const router = express.Router();
const controller = require('../controller').project;

router.route('/:id')
    .get(controller.getProject)
    .post(controller.postProject);
    
router.route('/:id/objects')
    .get(controller.getProjectObjects)
    .post(controller.postProjectObjects);

router.route('/:id/export')
    .get(controller.getProjectExport)
    .post(controller.postProjectExport);

router.route('/:id/export/:log')
    .get(controller.getProjectExportLog);

router.route('/:id/database')
    .get(controller.getProjectDB)
    .post(controller.saveProjectDB);

module.exports = router;