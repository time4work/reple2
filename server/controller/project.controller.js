const ProjectService = require('../service/project.service');
const ExportService = require('../service/export-data.service');
const ObjectMakerService = require('../service/object-maker.service');

// const ExportService = require('../service/export-data.service'); // TODO - export-task


module.exports = {

	getPage: async (request, response) => {
		return ProjectService.selectProjectsRelation(scope =>
			response.render('pages/projects', { scope })
		);
	},

	searchProjects: async (request, response) => {
		const name = request.body.name.toLowerCase();
		return ProjectService.searchProjects(name)
			.then(projects =>
				response.json(projects)
			);
	},

	createProject: async (request, response) => {
		const name = request.body.name.toLowerCase();
		return ProjectService.createProject(name)
			.then(() =>
				response.redirect('/projects')
			);
	},

	getProject: async (request, response) => {
		const project_id = request.params.id;
		return ProjectService.getProject(project_id)
			.then(scope =>
				response.render('pages/project', { scope })
			);
	},

	// TODO: refactoring
	saveProject: async (request, response) => {
		const project_id = request.params.id;
		const name = request.body.name.toLowerCase();
		const info = request.body.info;
		const d_tmpls = request.body.d_tmpls;
		const t_tmpls = request.body.t_tmpls;
		const db = request.body.db;
		const jsons = request.body.jsons;

		if (!name) return;

		return ProjectService.saveProjectChanges(
			project_id,
			name,
			info,
			t_tmpls,
			d_tmpls,
			jsons,
			db,
			() => {
				response.send({ result: 'saved' });
			}
		);

	},

	showProjectScreensDir: async (request, response) => {
		const project_id = request.params.id;
		return ProjectService.showProjectScreensDir(project_id)
			.then(result => response.json(result));
	},

	navigateProjectScreensDir: async (request, response) => {
		const params = {
			curpath: request.body.path,
			way: request.body.way,
		};
		return ProjectService.navigateProjectScreensDir(params)
			.then(result => response.json(result));
	},

	saveProjectSceenDir: async (request, response) => {
		const project_id = request.params.id;
		const selectedpath = request.body.path;
		return ProjectService.saveProjectSceenDir(project_id, selectedpath)
			.then(() => response.json({ success: true }));
	},

	//! TODO: delete-ptoject-task
	deleteProject: () => {
		const project_id = request.params.id;
		return ProjectService.deleteProject(project_id)
			.then(() => {
				response.send({ redirect: '/projects/' });
			});
	},

	getProjectObjects: async (request, response) => {
		const project_id = request.params.id;
		return ProjectService.getProjectObjects(project_id)
			.then(scope => response.render('pages/objects', { scope }));
	},

	createProjectObjects: async (request, response) => {
		const project_id = request.params.id;
		return ObjectMakerService.createProcess(project_id)
			.then(() => response.json({
				success: true
			}))
			.catch(e => response.status(400).json({
				success: false,
				error: e
			}));
	},

	// getExportPage: async (request, response) => {}, // TODO - export-task

	// startExport: async (request, response) => {}, // TODO - export-task

	getProjectDB: async (request, response) => {
		const project_id = request.params.id;

		return ProjectService.getProjectDB(project_id)
			.then(scope => response.render('pages/db', { scope }));
	},

	saveProjectDB: async (request, response) => {
		const project_id = request.params.id;
		const pack = request.body.pack;

		switch (pack.db_type) {
			case "localhost":
				return ProjectService.saveProjectDB(project_id, pack)
					.then(() => {
						response.send("ok");
					});
			case "foreignhost":
			//// TODO: no need for now !
			// return await ProjectService.saveProjectForeighDB(project_id, pack)
			// 	.then(() => {
			// 		response.send("ok");
			// 	});
			default:
				response.send("oops");
		}
	},

	getProjectExport: async (request, response) => {
		const project_id = request.params.id;

		await ProjectService.selectProjectReadyObjectsCount(project_id, async (projectReadyCount) => {
			await ProjectService.selectProjectPublishedObjectsCount(project_id).then(async projectPublishedCount => {
				ProjectService.getProjectDB(project_id)
					.then(scope => response.render('pages/export', {
						scope,
						readyCount: projectReadyCount,
						publishedCount: projectPublishedCount
					}));
			});
		});
	},

	pushProjectExport: async (request, response) => {
		const project_id = request.params.id;

		await ProjectService.getProjectDB(project_id)
			.then(async db_param => {
				await ProjectService.getProjectObjects(project_id).then(async project_objects => {
					await ExportService.exportObjects(project_id, db_param.dbhost, project_objects.objects).then(async res => {
						response.send(res);
					});
				});
			});
	}
}
