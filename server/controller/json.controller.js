const JsonService = require('../service/json.service');

module.exports = {

	getPage: async (request, response) => {
		return JsonService.getJsons(files => {
			response.render('pages/json', {
				scope: {
					jsons: files
				}
			});
		});
	},

	postJson: async (request, response) => {
		let jsonId;

		switch (request.body.type) {

			case "json.file.download":
				jsonId = request.body.id;

				await JsonService.getJson(jsonId, async obj => {
					if (obj) {
						response.send({ resp: obj });
					} else response.send({ err: "bad obj id" });
				});
				break;

			case "json.file.save":
				const obj = await JSON.parse(request.body.data);
				const name = request.body.name;
				await JsonService.saveJson(obj, name, async () => {
					response.send({ resp: 'json loaded' });
				});
				break;

			case "json.file.delete":
				jsonId = request.body.id;

				await JsonService.deleteJson(jsonId, async obj => {
					if (obj) {
						response.send({ resp: obj });
					} else response.send({ err: "bad obj id" });
				});
				break;

			default:
				console.log(" O O O P S . . . ");
				response.send({ err: 'o o o p s' });
		}
	},

}