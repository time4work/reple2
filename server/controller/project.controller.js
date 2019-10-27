const path = require('path');

const ProjectService = require('../service/project.service');

// const ExportService = require('../service/export-data.service'); // TODO - export-task

const TemplateService = require('../service/template.service');
const ObjectMakerService = require('../service/object-maker.service');
const { selectDir, simpleSort } = require('../helper');

// let ExportProgress = false;  // TODO - export-task

module.exports = {

	getPage: async (request, response) => {
		return ProjectService.selectProjectsRelation(scope => {
			response.render('pages/projects', { scope });
		});
	},

	searchProjects: async (request, response) => {
		const name = request.body.name.toLowerCase();

		return ProjectService.searchProject(name)
			.then(projects => {
				response.send(projects);
			});
	},

	createProject: async (request, response) => {
		const name = request.body.name.toLowerCase();

		return ProjectService.createProject(name)
			.then(() => {
				response.redirect('/projects');
			});
	},

	getProject: async (request, response) => {
		const project_id = request.params.id;
		// TODO: REFACTOR
		// const project = await ProjectService.selectProject(project_id);
		await ProjectService.selectProject(project_id, async (result) => {
			await ProjectService.selectProjectSize(project_id, async (result4) => {
				await TemplateService.selectTmpls(async (result5) => {
					await ProjectService.selectProjectTmpls(project_id, async (result6) => {
						await ProjectService.selectProjectJson(project_id, async (result7) => {
							await ProjectService.selectAllJsons(async (result8) => {
								response.render('pages/project', {
									scope: {
										project: result,
										size: result4,
										tmpls: result5,
										tmplRelation: result6,
										jsons: result7,
										jsonsAvailable: result8
									}
								});
							});
						});
					});
				});

			});
		});
	},

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

		return ProjectService.selectProjectDir(project_id, (select_dir_result) => {
			let fullpath;

			if (select_dir_result.length == 0)
				fullpath = path.resolve("./screens");
			else
				fullpath = select_dir_result[0].dir;

			selectDir(fullpath, (list) => {
				if (fullpath != '/')
					list.push('..');
				list.sort((a, b) => a > b ? 1 : a < b ? -1 : 0);
				response.send({ list: list, path: fullpath });
			});
		});
	},

	navigateProjectScreensDir: async (request, response) => {
		const curpath = request.body.path;
		const way = request.body.way;
		const fullpath = path.join(curpath, way);

		return selectDir(fullpath, (list) => {
			if (fullpath != '/')
				list.push('..');

			list.sort(simpleSort);
			response.send({ list, path: fullpath });
		});
	},

	saveProjectSceenDir: async (request, response) => {
		const project_id = request.params.id;
		const selectedpath = request.body.path;

		return selectDir(selectedpath, async (list) => {
			if (!list) {
				throw new Error();
			}
			return ProjectService.saveProjectDir(project_id, selectedpath)
				.then(() => {
					response.send({ result: "ok" });
				});
		});
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
		let project_id = request.params.id;
		return ProjectService.getProjectObjects(project_id)
			.then(scope => response.render('pages/objects', { scope }));
		// const objects = await getProjectReadyObject(project_id);
		// response.render('pages/objects', {
		// 	scope: {
		// 		project: {
		// 			id: project_id
		// 		},
		// 		size: 0,
		// 		size2: 0,
		// 		objects: []
		// 	}
		// });
	},

	postProjectObjects: async (request, response) => {
		const project_id = request.params.id;
		// let result;
		switch (request.body.type) {
			case 'objects.thumbs.make':
				return ObjectMakerService.createProcess(project_id)
					.then(() => response.json({ success: true }))
					.catch(e => response.status(400).json({ success: false, error: e }));

				// await ProjectService.selectProjectDir(project_id, async (select_dir_result) => {
				// 	var fullpath;
				// 	if (select_dir_result.length == 0)
				// 		fullpath = path.resolve("./screens");
				// 	else
				// 		fullpath = select_dir_result[0].dir;

				// 	await ProjectService.selectProjectObjects(project_id, async (objects) => {
				// 		result = await TM.createProcess(project_id, fullpath, objects);
				// 		response.send({ status: result });
				// 	});
				// });

				break;
			// TODO: generator-task

			// case 'process.thumbs.terminate':
			// 	result = await TM.stopProcess(project_id);
			// 	response.send({ status: result });
			// 	break;
			// case 'objects.thumbs.check':
			// 	result = await TM.getStatus(project_id);

			// 	if (!result.status)
			// 		response.send({ msg: 'no process' });
			// 	else
			// 		response.send({
			// 			status: result.status,
			// 			step: result.step,
			// 			time: result.time,
			// 		});
			// 	break;
			// default:
			// 	response.send({ err: "opps, wrong type " });
		}
	},

	// getExportPage: async (request, response) => {}, // TODO - export-task

	// startExport: async (request, response) => {}, // TODO - export-task

	getProjectDB: async (request, response) => {
		const project_id = request.params.id;

		return ProjectService.selectProjectDB(project_id)
			.then(db => {
				response.render('pages/db', {
					scope: {
						dbhost: db,
						project: {
							id: project_id,
						},
					}
				});
			});
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
			//// no need for now !
			// return await ProjectService.saveProjectForeighDB(project_id, pack)
			// 	.then(() => {
			// 		response.send("ok");
			// 	});
			default:
				response.send("oops");
		}
	},
}
