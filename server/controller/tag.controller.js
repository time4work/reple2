const service = require('../service/tag.service');

module.exports = {

    getTagsPage: async (request, response) => {
		await service.selectTagsEx(result => {
			response.render('pages/tags',{
                array : result
            });
		});
	},
    
    postTags: async (request, response) => {
		let name;

		switch (request.body.type) {
			case "search":
				name = request.body.name.toLowerCase();
				if (!name)
					response.send("oops");
				else
					await service.searchTag(name, result => {
						response.send(result);
					});
				break;
			case "add":
				name = request.body.name.toLowerCase();
				if (!name)
					response.send("oops");
				else
					await service.createTag(name, result => {
						response.redirect('/tags');
					});
				break;
			default:
		}
	},

	getTagPage: async (request, response) => {
		let tag_id = request.params.id;

		await service.selectTag(tag_id, async result => {
			await service.selectNullTags( async result2 => {
				await service.selectTagSyns(tag_id, async result3 => {
					response.render('pages/tag', { 
                        scope : { 
                            tag:result[0], 
                            tags:result2, 
                            syns: result3
                        } 
                    });
				});
			});
		});
    },
    
	postTag: async function(request, response) { 
		const tag_id = request.params.id;

		switch(request.body.type){
			case "save":
				const name = request.body.name.toLowerCase();
				const syns = request.body.syns;
				const syn_arr = syns.split(',').map(x => parseInt(x));

				await service.saveTagChanges(tag_id, name, syn_arr, () => {
					response.redirect(`/tag/${tag_id}`);
				});
				break;
			case "tag.del":
				await service.deleteTag(tag_id, result => {
					response.send({redirect:'/tags/'});
				});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
    },
    
}