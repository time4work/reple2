const ProjectService = require('../service/project.service');
const GeneratorService = require('../service/generator.service');

let GeneratorProgress = false;

module.exports = {

	getPage: async (request, response) => {
		await GeneratorService.selectOriginalAllSize(async result => {
			await ProjectService.selectProjects(result2 => {
				response.render('pages/generator', {
					scope: {
						size: result,
						projects: result2
					}
				});
			});
		});
	},

	postGenerator: async (request, response) => {
		let project_id, size;

		switch (request.body.type) {
			case "original.size":
				project_id = request.body.id;

				//await GeneratorService.selectProjectOriginalSize(project_id, result => {
					response.send({ res: 1000 });
				//})
				break;
			case "generator.check":
				if (GeneratorProgress)
					response.send({ status: true });
				else
					response.send({ status: false });
				break;
			case "object.transfiguration":
				if (GeneratorProgress) {
					response.send({ process: true });
					break;
				}
				project_id = request.body.id;
				size = request.body.size;
				GeneratorProgress = true;
				await GeneratorService.createProjectObjects(project_id, size, result => {
					response.send({ res: result });
					GeneratorProgress = false;
				});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({ err: 'o o o p s' });
		}
	},

}