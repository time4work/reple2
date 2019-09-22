const TemplateService = require('../service/template.service');
const service = require('../service/template.service');
const punctREGEX = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^`{|}~]/g;
const punctREGEX2 = /[\u2000-\u206F\u2E00-\u2E7F\\"\\/<>\[\]^`{|}]/g;

module.exports = {
	getPage: async (request, response) => {
		await TemplateService.selectTmpls(async result => {
			response.render('pages/templates', {
				array: result
			});
		});
	},

	postTemplates: async (request, response) => {
		let name = request.body.name.toLowerCase();
		if (!name)
			response.send("oops");
		else
			switch (request.body.type) {
				case "search":
					await service.searchTmpl(name, result => {
						response.send(result);
					});
					break;
				case "import.template":
					const data = await JSON.parse(request.body.data.toString('utf8'));
					if (data) {
						await service.importTemplate(name, data, result => {
							response.send(result);
						});
						break;
					}
				case "add":
					await service.createTmpl(name, result => {
						response.redirect('/templates');
					});
					break;
				default:
					response.send("oops");
			}
	},

	getTemplate: async (request, response) => {
		const template_id = request.params.id;

		await service.selectTmpl(template_id, async tmpl => {
			await service.selectTmplKeys(template_id, async keys => {

				const formatTemplates = await service.formatTMPL(keys);

				await service.selectLibraryItems(async library => {
					response.render('pages/template', {
						scope: {
							tmpl: tmpl[0],
							template: formatTemplates,
							library: library
						}
					});
				});
			});
		});
	},

	postTemplate: async function (request, response) {
		const tmpl_id = request.params.id;

		switch (request.body.type) {
			case "saveTmpl":
				const name = request.body.name.toLowerCase();
				if (!name) return;

				await service.saveTmplChanges(tmpl_id, name, () => {
					response.redirect(`/template/${tmpl_id}`);
				});
				break;
			case "delTmpl":
				await service.deleteTmpl(tmpl_id, result => {
					response.send({
						answer: result
					});
				});
				break;
			case "newKey":
				const key = request.body.key.replace(punctREGEX, '');
				if (!key) return

				await service.createTmplKey(tmpl_id, key, (result) => {
					response.send({ answer: result });
				});
				break;
			case "delKey":
				const key_id = request.body.keyID;
				if (!key_id)
					response.send({ err: 'oops' });

				await service.deleteTmplKey(key_id, result => {
					response.send({ answer: result });
				});
				break;
			case "newVal":
				const val_key_id = request.body.keyID;
				const value = request.body.value;
				if (!val_key_id || !value) {
					response.send({ answer: false });
					break;
				}
				await service.createTmplValue(val_key_id, value, result => {
					if (result)
						response.send({
							answer: true,
							id: result
						});
					else
						response.send({ answer: false });
				});
				break;
			case "delVal":
				const val_id = request.body.valID;

				await service.deleteTmplValue(val_id, result => {
					response.send({ answer: result });
				});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({ err: 'o o o p s' });
		}
	},

}