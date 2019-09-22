const service = require('../service/library.service');

const punctREGEX2 = /[\u2000-\u206F\u2E00-\u2E7F\\"\\/<>\[\]^`{|}]/g;

module.exports = {

	getPage: async (request, response) => {
		await service.selectLibraryItems(async result => {
			response.render('pages/library', {
				scope: {
					library: result
				}
			});
		});
	},

	postLibrary: async (request, response) => {
		let keyID;

		switch (request.body.type) {
			case "library.key.create":
				if (request.body.name) {
					const keyName = request.body.name
						.toLowerCase()
						.replace(punctREGEX, '');
					await service.createLibraryKey(keyName, async result => {
						response.send({ status: 'ok' });
					});
				} else response.send({ err: 'new key name err' });
				break;
				
			case "library.export":
				await service.selectLibraryItems(list => {
					response.send(list);
				});
				break;
				
			case "import.library":
				const data = await JSON.parse(request.body.data.toString('utf8'));
				if (data) {
					await service.importLibrary(data, result => {
						response.send(result);
					});
					break;
				}
				
			case "library.key.delete":
				if (request.body.id) {
					keyID = request.body.id;
					await service.deleteLibraryKey(keyID, async (result) => {
						response.send({ status: 'ok' });
					});
				} else response.send({ err: 'new key name err' });
				break;

			case "library.key.value.add":
				if (request.body.id && request.body.value) {
					keyID = request.body.id;
					const keyValue = request.body.value
						.toLowerCase()
						.replace(punctREGEX2, '');

					await service.addLibraryKeyValue(keyValue, async valueID => {
						await service.createRelationLibraryKeyValue(keyID, valueID, async () => {
							response.send({ status: 'ok', id: valueID });
						});
					});
				} else
					response.send({
						err: 'new key name err'
					});
				break;

			case "library.key.value.delete":
				if (request.body.value_id) {
					const valueID = request.body.value_id;
					await service.deleteLibraryKeyValue(valueID, async () => {
						response.send({ status: 'ok' });
					});
				} else response.send({ err: 'new key name err' });
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({ err: 'o o o p s' });
		}
	},

}