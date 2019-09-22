const path = require('path');

const ProjectService = require('../service/project.service');
const ExportService = require('../service/export-data.service');
const TemplateService = require('../service/template.service');
const TagService = require('../service/tag.service');
const { selectDir } = require('../helper');

let ExportProgress = false;

module.exports = {

	getPage: async (request, response) => {
		await ProjectService.selectProjectsRelation(result => {
			response.render('pages/projects', {
				scope: result
			});
		});
	},

	postProjects: async (request, response) => {
		let name = request.body.name.toLowerCase();

		switch (request.body.type) {
			case "search":
				await ProjectService.searchProject(name, (result) => {
					response.send(result);
				});
				break;
			case "add":
				await ProjectService.createProject(name, (result) => {
					response.redirect('/projects');
				});
				break;
			default:
				console.log("WRONG type: " + request.body.type);
		}
	},

	getProject: async (request, response) => {
		let project_id = request.params.id;

		await ProjectService.selectProject(project_id, async (result) => {
			await ProjectService.selectProjectSize(project_id, async (result4) => {
				await TemplateService.selectTmpls(async (result5) => {
					await ProjectService.selectProjectTmpls(project_id, async (result6) => {
						response.render('pages/project', {
							scope: {
								project: result,
								size: result4,
								tmpls: result5,
								tmplRelation: result6
							}
						});
					});
				});

			});
		});
	},

	postProject: async (request, response) => {
		let project_id = request.params.id;

		switch (request.body.type) {
			case "project.showDir":
				await ProjectService.selectProjectDir(project_id, (select_dir_result) => {
					var fullpath;

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
				break;
			case "project.navigate":
				let curpath = request.body.path;
				let way = request.body.way;
				var fullpath = path.join(curpath, way);

				await selectDir(fullpath, (list) => {
					if (fullpath != '/')
						list.push('..');

					list.sort((a, b) => a > b ? 1 : a < b ? -1 : 0);
					response.send({ list: list, path: fullpath });
				});
				break;
			case "project.dir.save":
				let selectedpath = request.body.path;

				await selectDir(selectedpath, async (list) => {
					if (list)
						await ProjectService.saveProjectDir(project_id, selectedpath, (r) => {
							if (r) response.send({ result: "ok" });
						});
				});
				break;
			case "project.save":
				let name = request.body.name.toLowerCase();
				let info = request.body.info;
				let d_tmpls = request.body.d_tmpls;
				let t_tmpls = request.body.t_tmpls;
				let db = request.body.db;
				if (!name)
					return;

				await ProjectService.saveProjectChanges(
					project_id,
					name,
					info,
					t_tmpls,
					d_tmpls,
					db,
					() => {
						response.send({ result: 'saved' });
					}
				);
				break;
			case "project.delete":
				await ProjectService.deleteProject(project_id, () => {
					response.send({ redirect: '/projects/' });
				});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({ err: 'o o o p s' });
		}
	},

	getProjectObjects: async (request, response) => {
		let project_id = request.params.id;
		await ProjectService.selectProject(project_id, async (result) => {
			await ProjectService.selectProjectSize(project_id, async (result2) => {
				await ProjectService.selectProjectObjects(project_id, async (result3) => {
					await ProjectService.selectProjectReadyObjectLength(result3, async (result4) => {
						response.render('pages/objects', {
							scope: {
								project: result,
								size: result2,
								size2: result4,
								objects: result3
							}
						});
					});
				});
			});
		});
	},

	postProjectObjects: async (request, response) => {
		const project_id = request.params.id;
		let result;
		switch (request.body.type) {
			case 'objects.thumbs.make':
				await ProjectService.selectProjectDir(project_id, async (select_dir_result) => {
					var fullpath;
					if (select_dir_result.length == 0)
						fullpath = path.resolve("./screens");
					else
						fullpath = select_dir_result[0].dir;

					await ProjectService.selectProjectObjects(project_id, async (objects) => {
						result = await TM.createProcess(project_id, fullpath, objects);
						response.send({ status: result });
					});
				});

				break;
			case 'process.thumbs.terminate':
				result = await TM.stopProcess(project_id);
				response.send({ status: result });
				break;
			case 'objects.thumbs.check':
				result = await TM.getStatus(project_id); // const TM = new thumbManager(io);

				if (!result.status)
					response.send({ msg: 'no process' });
				else
					response.send({
						status: result.status,
						step: result.step,
						time: result.time,
					});
				break;
			default:
				response.send({ err: "opps, wrong type " });
		}
	},

	getProjectTags: async (request, response) => {
		const project_id = request.params.id;
		await TagService.selectTags(async (alltags) => {
			await ProjectService.selectProjectTags(project_id, async (relation) => {
				const assocT = [],
					stopT = [],
					hideT = [],
					catT = [];

				relation.map(e => {
					if (e.type == "positive") assocT.push(e);
					else if (e.type == "negative") {
						stopT.push(e);
					}
					else if (e.type == "hidden") hideT.push(e);
					else if (e.type == "categories") catT.push(e);
				});

				response.render('pages/projecttags', {
					scope: {
						project: {
							id: project_id
						},
						tags: {
							all: alltags,
							assoc: assocT,
							stop: stopT,
							unshow: hideT,
							categories: catT,
						}
					}
				});
			});
		});
	},

	postProjectTags: async (request, response) => {
		const project_id = request.params.id;
		const assocTags = request.body.tags.positive ? request.body.tags.positive : [];
		const stopTags = request.body.tags.negative ? request.body.tags.negative : [];
		const hideTags = request.body.tags.hidden ? request.body.tags.hidden : [];
		const categoryTags = request.body.tags.categories ? request.body.tags.categories : [];
		const tags = {
			positive: assocTags,
			negative: stopTags,
			hidden: hideTags,
			categories: categoryTags
		}

		await ProjectService.saveProjectTags(project_id, tags, async result => {
			response.send({ status: result });
		});
	},

	getProjectExport: async (request, response) => {
		let project_id = request.params.id;
		await ProjectService.selectProject(project_id, async (project) => {
			await ProjectService.selectProjectDB(project_id, async (db) => {
				await ProjectService.selectProjectLogs(project_id, async (logs) => {
					await ProjectService.selectProjectUnmappedObjects(project_id, async (um_objects) => {
						await ProjectService.selectProjectReadyObjects(um_objects, async (objects) => {
							await ExportService.selectExportLogs(project_id, async (exportlogs) => {
								response.render('pages/export', {
									scope: {
										project: project,
										db: db,
										logs: logs,
										objs: objects,
										exportlogs: exportlogs
									}
								});
							});
						});
					});

				});
			});
		});
	},

	postProjectExport: async (request, response) => {
		const project_id = request.params.id;

		switch (request.body.type) {
			case "project.export.check":
				if (ExportProgress)
					response.send({ status: true });
				else
					response.send({ status: false });
				break;
			case "project.export.push":
				if (ExportProgress) {
					response.send({ process: true });
					break;
				}
				ExportProgress = true;
				await ProjectService.selectProjectDB(project_id, async (projectDB) => {

					if (projectDB.flag == 0) {
						await ProjectService.selectProjectDBlocalhost(projectDB.dbhID, async (db_params) => {
							await ProjectService.selectProjectUnmappedObjects(project_id, async (um_objects) => {
								await ProjectService.selectProjectReadyObjects(um_objects, async (objects) => {
									await ExportService.exportObjects(project_id, db_params, objects, async (result) => {
										ExportProgress = false;
										response.send({ status: "finish" });
									});
								});
							});
						});
					} else response.send({ err: "oops" });
				});
				break;
			default:
				response.send("oops");
		}
	},

	getProjectExportLog: async (request, response) => {
		const project_id = request.params.id;
		const export_log_id = request.params.log;

		await ProjectService.selectProject(project_id, async (result) => {
			await ProjectService.selectExportLog(export_log_id, async (result2) => {
				await ProjectService.selectExportLogObjects(export_log_id, async (result3) => {
					response.render('pages/log_objects', {
						scope: {
							project: result,
							log: result2,
							objects: result3
						}
					});
				});
			});
		});
	},

	getProjectDB: async (request, response) => {
		const project_id = request.params.id;

		await ProjectService.selectProject(project_id, async (result) => {
			await ProjectService.selectProjectDB(project_id, async (result2) => {
				if (!result2) {
					result2 = [];
					response.render('pages/db', {
						scope: {
							project: result,
							db: result2
						}
					});
				} else {
					await ProjectService.selectProjectDBlocalhost(result2.dbhID, async (result3) => {
						if (result2.sshhID) {
							await ProjectService.selectProjectDBsshhost(result2.sshhID, async (result4) => {
								response.render('pages/db', { scope: { project: result, db: result2, dbhost: result3, ssh: result4 } });
							});
						} else {
							response.render('pages/db', {
								scope: {
									project: result,
									db: result2,
									dbhost: result3
								}
							});
						}
					});
				}
			});
		});
	},

	saveProjectDB: async (request, response) => {
		const project_id = request.params.id;
		const pack = request.body.pack;

		switch (pack.db_type) {
			case "localhost":
				await ProjectService.saveProjectDB(project_id, pack, () => {
					response.send("ok");
				});
			case "foreignhost":
			// await helpers.createTmpl(name, (result) => {
			// 	response.redirect('/templates');
			// });
			// break;
			default:
				response.send("oops");
		}
	},
}
