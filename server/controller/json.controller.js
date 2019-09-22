let JsonImportProgress = false;
let JsonImportId = -1;

module.exports = {

    getPage: async (request, response) => {
		await helpers.getJsons(async files => {
            response.render('pages/json',{
                scope:{
                    jsons: files
                }
            });
		});
    },
    
	postJson: async (request, response) => {
		switch (request.body.type) {
			case "json.file.download":
				const jsonId = request.body.id;

				await helpers.getJson(jsonId, async obj => {
					if (obj) {
						response.send({ resp: obj });
					} else response.send({ err: "bad obj id" });
				});
				break;
			case "json.file.save":
				const obj = await JSON.parse(request.body.data);
				const name = request.body.name;
				await helpers.saveJson(obj, name, async () => {
					response.send({ resp: 'json loaded' });
				});
				break;
			case "json.file.import":
				if (!JsonImportProgress) { // TODO: via service
					const jsonId = request.body.id;
					await helpers.getJson(jsonId, async (obj, file_name) => {
						JsonImportProgress = true;
						JsonImportId = jsonId;

						response.send({ resp: 'import started', id: JsonImportId });
						
						await helpers.importJson(obj, file_name, async (result) => {
							JsonImportProgress = false;
							JsonImportId = -1;
						});
					});
				} else {
					response.send({resp: 'process busy', id:JsonImportId});
				}

				break;
			case "json.import.process.check":
				if (!JsonImportProgress) {
					response.send({ resp: {'id': -1} });
				} else {
					response.send({ resp: {'id': JsonImportId} });
				}
				break;
			case "json.file.del":
				break;
			default:
				console.log(" O O O P S . . . ");
                response.send({err:'o o o p s'});
		}
    },

}