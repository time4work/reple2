const { myquery, asynccon } = require('../helper/mysql');
const Tree = require('../helper/tree');
const fs = require('fs');
const getLink = require('../helper/scrapper').getLink;

module.exports = {

    selectOriginalAllSize: async (callback) => {
        try {
            const query = "SELECT count(*) FROM original";
            const size = await myquery(query, []);
            const result = size[0]['count(*)'];

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectOriginalSize: async (projectID, callback) => {
        const connection = await asynccon();
        try {
            const positiveArr = [];
            const negetiveArr = [];
            await selectProjectTags(connection, projectID, async (result) => {
                for (let i = 0; i < result.length; i++) {
                    if (result[i].positive == 0) {
                        await negetiveArr.push(result[i].tagID);
                    } else {
                        await positiveArr.push(result[i].tagID);
                    }
                }
            });
            let originalIDarr = await findFilteredOriginal(connection, projectID, { positive: positiveArr, negetive: negetiveArr });

            if (callback) await callback(originalIDarr.length);

        } catch (e) {
            console.log(e);
            return 0;
        }
    },


    createProjectObjects: async (projectID, size, callback) => {
        const connection = await asynccon();
        try {
            // const positiveArr = [];
            // const negetiveArr = [];
            // await selectProjectTags(connection, projectID, async (result) => {
            //     for (let i = 0; i < result.length; i++) {
            //         if (result[i].positive == 0) {
            //             await negetiveArr.push(result[i].tagID);
            //         } else {
            //             await positiveArr.push(result[i].tagID);
            //         }
            //     }
            // });
            //const originalIDarr = await findFilteredOriginal(connection, projectID, { positive: positiveArr, negetive: negetiveArr });

            const jsons = await selectProjectJson(projectID);

            var objectArr = [];

            for(i in jsons){
                let arr = JSON.parse(fs.readFileSync(`./json/${jsons[i].name}`));
                objectArr = objectArr.concat(arr);
            }

            // console.log(objectArr);

            //const originalIDarr;

            if (size > objectArr.length)
                size = objectArr.length;

            const logID = await createObjectLog(projectID);

            for (let j = 0; j < size; j++) {
                //const originalID = originalIDarr[j].originalID;
                let original = objectArr[j];

                // console.log(original);

                    const donor_link = original.video;
                    const video_link = await getLink(donor_link);

                    console.log(video_link);
                    
                    //const originalTags = await selectOriginalTags(connection, originalID);

                    // const synTags = [];
                    // for (var q = 0; q < originalTags.length; q++) {
                    //     let syns = await selectTagSyns(originalTags[q].tagID);

                    //     if (syns.length > 0)
                    //         for (var k = 0; k < syns.length; k++) {
                    //             synTags.push(syns[k]);
                    //         }
                    //     else
                    //         synTags.push(originalTags[q].tagID);
                    // }

                    // template key lib 
                    const tmpl_lib_pack = await selectLibraryItems();

                    // description tmpls 
                    const d_tmpl_packs = await selectProjectTemplates('description', projectID);

                    // if (d_tmpl_packs[0].length == 0)
                    //     return null;

                    let description = null;
                    do {
                        const min = 0;
                        const max = d_tmpl_packs.length - 1;
                        const rand = min + Math.floor(Math.random() * (max + 1 - min));
                        const d_tmpl_pack = d_tmpl_packs[rand];

                        d_tmpl_packs.splice(rand, 1);

                        const tree = await new Tree('talk', d_tmpl_pack, tmpl_lib_pack);
                        description = await tree.createText();
                        description = (description.length > 1000)
                            ? description.slice(0, 1000)
                            : description;
                    } while (!description && d_tmpl_packs.length);

                    if (!description) return null;

                    const t_tmpl_packs = await selectProjectTemplates('title', projectID);

                    if (t_tmpl_packs[0].length == 0)
                        return null;

                    let title = null;
                    do {
                        const min = 0;
                        const max = t_tmpl_packs.length - 1;
                        const rand = min + Math.floor(Math.random() * (max + 1 - min));
                        const t_tmpl_pack = t_tmpl_packs[rand];

                        t_tmpl_packs.splice(rand, 1);

                        const tree = await new Tree('talk', t_tmpl_pack, tmpl_lib_pack);
                        title = await tree.createText();
                    } while (!title && t_tmpl_packs.length);

                    title = (title.length > 100)
                        ? title.slice(0, 100)
                        : title;

                    if (!title) return null;

                    await createObject(projectID, title, description, video_link, donor_link, logID);
                    //await createRelationTagObj(objID, originalTags);
                
            }
            result = objectArr;

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

}


async function selectProjectTags(connection, projectID, callback) {
    try {
        const tags = [];

        let query = 'SELECT r.tagID, r.type, t.flag, t.name FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID';
        const fields = await connection.execute(query, [projectID]); // !
        const results = fields[0]
            .filter(e => e.type == "positive" || e.type == "negative");

        query = " select id as tagID, name"
            + " from tag"
            + " where flag = "
            + " ("
            + " 	select flag"
            + " 	from tag"
            + " 	where id = ?"
            + " )"
            + " and id not in (?)";
        for (var i = 0; i < results.length; i++) {
            let _copy = tags.filter(e => e.tagID == results[i].tagID);

            if (_copy.length != 0) continue;

            if (results[i].type == "positive")
                results[i].positive = 1;
            else
                results[i].positive = 0;

            await tags.push(results[i]); // PUSH

            if (results[i].flag != null) {
                let id = results[i].tagID;
                let more_result = await myquery(query, [id, id]);
                for (var j = 0; j < more_result.length; j++) {
                    let copy = tags.filter(e => e.tagID == more_result[j].tagID);

                    if (copy.length == 0) {
                        more_result[j].type = results[i].type;
                        more_result[j].positive = results[i].positive;
                        await tags.push(more_result[j]); // PUSH
                    }
                }
            }
        }

        await callback(tags);

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function findFilteredOriginal(connection, projectID, tagIDs) {
    try {
        let query = " SELECT originalID " +
            " FROM relationTagOriginal ";
        if (tagIDs.positive.length > 0) {
            query += " WHERE tagID in ( "

            for (var j = 0; j < tagIDs.positive.length; j++) {
                if (j == tagIDs.positive.length - 1)
                    query += " " + tagIDs.positive[j] + " ";
                else
                    query += " " + tagIDs.positive[j] + ", ";
            }
            query += " ) ";
        }

        if (tagIDs.negetive.length > 0) {
            if (!tagIDs.positive.length)
                query += " WHERE ";
            else
                query += " AND ";

            query += " originalID not in " +
                " ( " +
                " SELECT originalID " +
                " FROM relationTagOriginal ";
            for (let j = 0; j < tagIDs.negetive.length; j++) {
                if (j == 0)
                    query += " WHERE tagID = " + tagIDs.negetive[j];
                else
                    query += " OR tagID = " + tagIDs.negetive[j];
            }
            query += " ) ";
        }
        query += ""
            + "AND originalID not in ("
            + "select originalID "
            + "from relationProjectOriginal "
            + "where projectID = " + projectID
            + ")";
        query += "GROUP BY originalID";

        const fields = await connection.execute(query);
        const result = fields[0];

        return result;

    } catch (e) {
        console.log(e);
        return -1;
    }
}

async function selectProjectJson (projectID, callback) {
    try {
        const query = ""
            + "	SELECT "
            + " * "
            + "	FROM relationProjectJson AS r "
            + " INNER JOIN jsonFiles AS j "
            + " ON r.jsonID = j.id "
            + "	WHERE r.projectID = ?";

        const result = await myquery(query, [projectID]);

        if (callback) await callback(result);
        return result;

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function createObjectLog(projectID) {
    try {
        const type = 'import'
        const query = ""
            + " Insert Into"
            + " projectLog "
            + " (projectID, type, date)"
            + " values (?,?,NOW())";
        const log = await myquery(query, [projectID, type]);
        return log.insertId;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function selectOriginal(connection, originalID, callback) {
    try {
        const query = 'SELECT * FROM original WHERE id = ?';
        const fields = await connection.execute(query, [originalID]);
        const result = fields[0][0];

        await callback(result);
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function selectOriginalTags(connection, originalID, callback) {
    try {
        const query = 'SELECT t.name, r.tagID FROM relationTagOriginal r, tag t  WHERE t.id = r.tagID AND r.originalID = ?';
        const fields = await connection.execute(query, [originalID]); // !
        const results = fields[0];

        if (callback)
            await callback(results);
        return results;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function selectTagSyns(tagID, callback) {
    try {
        const query = ""
            + " select r.id "
            + " from tag r "
            + " where r.flag = "
            + " ( "
            + " 	select flag "
            + " 	from tag "
            + " 	where id = ? "
            + " ) "
            + " GROUP BY r.id ";
        const result = await myquery(query, [tagID]);

        const arr = [];
        for (let i = 0; i < result.length; i++) {
            arr.push(result[i].id);
        }

        if (callback) await callback(arr);
        return arr;

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function selectLibraryItems(callback) {
    try {
        const query = `
			SELECT r.id as 'keyID', r.name as 'key', res2.id as 'valueID', res2.value 
			FROM libraryKey r 
			left join 
				( 
					select * 
					from  libraryRelation 
				) as res on res.keyID = r.id  
			left join 
			( 
				select * 
				from  libraryValue 
			) as res2 on res2.id = res.valueID 
		`;
        let result = await myquery(query, []);

        let list = [...new Set(result.map(item => item.key))]
            .map((key) => {
                return { key: key, values: [] }
            });

        result.forEach((item, i, arr) => {
            let _key = result[i].key;

            for (var j = 0; j < list.length; j++) {
                if (list[j].key == _key) {
                    list[j].id = item.keyID;
                    if (item.value != null)
                        list[j].values.push({
                            id: item.valueID,
                            value: item.value,
                        });
                }
            }
        });

        if (callback) await callback(list);
        return list;

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function selectProjectTemplates(type, projectID, callback) {
    try {
        const query = `
			SELECT *
			FROM relationTmplProject
			WHERE projectID = ? and type = ?
		`;
        const relation = await myquery(query, [projectID, type]);

        if (!relation[0]) {
            console.log("oops");
            return null;
        }

        const result = [];
        const tmplIDs = relation;

        for (let x = 0; x < tmplIDs.length; x++) {
            const tmplID = tmplIDs[x].tmplID;
            const tmpl_query = `
				SELECT res.keyID, a.keyword, b.id, b.value as 'val'
				FROM replecon.tmplRelation res 
				left join ( 
					select * 
					from  replecon.tmplKey 
				) as a on a.id = res.keyID
				left join ( 
					select * 
					from  replecon.tmplValue 
				) as b on b.keyID = a.id 
				WHERE res.tmplID = ?
				ORDER BY a.keyword
			`;
            const tmpl_result = await myquery(tmpl_query, [tmplID]);
            result.push(tmpl_result);
        }

        if (callback) await callback(result);
        return result;

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function createObject(projectID, title, description, videolink, donorlink, logID) {

    try {
        var query = ""
            + " Insert Into"
            + " object "
            + " (DataTitle1, DataLink1, DataText1, FootPrint2, DataKey1)"
            + " values (?,?,?,?,?)";
        let object = await myquery(query,
            [title, videolink, description, donorlink, logID]);
        let objectID = object.insertId;
        query = ""
            + " Insert Into"
            + " relationProjectObject"
            + " (projectID, objectID)"
            + " values (?,?)";
        let relation = await myquery(query, [projectID, objectID]);

        // query = ""
        //     + " Insert Into"
        //     + " relationProjectOriginal"
        //     + " (projectID, originalID)"
        //     + " values (?,?)";
        // let relation2 = await myquery(query, [projectID, originalID]);
        return objectID;

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function createRelationTagObj(objID, tags) {
    try {
        var query = ""
            + " Insert Into"
            + " relationTagObject "
            + " (tagID, objectID)"
            + " values (?,?)";
        for (var i = 0; i < tags.length; i++) {
            const tagID = tags[i].tagID;
            await myquery(query, [tagID, objID]);
        }
        return;

    } catch (e) {
        console.log(e);
        return 0;
    }
}