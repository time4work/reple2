const { myquery } = require('../helper/mysql');
const fs = require('fs');

async function writeJson (name, date, size, callback) {
    try {
        let query = "INSERT INTO jsonFiles (`name`,`date`,`size`) VALUES (?,?,?)";
        let result = await myquery(query, [name, date, size]);

        console.log(result);
        if (callback)
            await callback(result);
        return result;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

module.exports = {

    myquery: async (query, params, callback) => { // !
        try {
            let result = await myquery(query, params); // !
            connection.end();

            if (callback)
                await callback(result, params); // !
            return result[0];

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    getJsons: async (callback) => {
        try {
            let query = "SELECT * FROM jsonFiles";
            let result = await myquery(query, []);

            console.log(result);
            if (callback)
                await callback(result);
            return result;
        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    importJson: async (json, callback) => { // !
        // var connection 	= await ASYNSQL(); // !
        try {
            // console.log(json.length);
            var connection = await POOLCON();
            for (var iter = 0; iter < json.length; iter++) {

                await new Promise(async (res, rej) => {

                    let item = json[iter];
                    console.log(" - - - - - - - - - - - - JSON ");
                    console.log(" -[ " + iter + " ] - - - - - JSON ");
                    console.log(" - - - - - - - - - - - - JSON ");
                    let bool = await uniqItem(connection, item);
                    if (bool) {
                        await magic(connection, item)
                            .then(async function (ids) {
                                console.log('------------- ids >');
                                console.log(ids);
                                await originalRelation(connection, ids);
                            })
                        return res(connection);
                    } else return res(connection);

                })

                // let item = json[iter];
                // console.log(" - - - - - - - - - - - - JSON ");
                // console.log(" -[ "+iter+" ] - - - - - JSON ");
                // console.log(" - - - - - - - - - - - - JSON ");
                // 	if(await uniqItem(connection,item)){
                // 		( magic(connection,item) )
                // 			.then(function(ids){
                // 				console.log('-------------ids');
                // 				console.log(ids);
                // 				originalRelation(connection,ids);
                // 			})
                // 			.then(function(){
                // 				connection.end();
                // 			});
                // 	}


                // let ids = await magic(connection,item); // !
                // console.log(ids);
                // await originalRelation(connection,ids); // !

                // await connection.end();

            }
            console.log(' Json Loaded ! ');
            connection.end();
            console.log('x x x x x x x - connection.end');

            // await connection.end();
            if (callback)
                await callback();
        } catch (e) {
            console.log(e);
        }
    },

    saveJson: async (json, name, callback) => {
        try {
            let length = json.length;
            let data = JSON.stringify(json);
            var date = new Date();
            var _name = "./json/" + name;

            await fs.writeFileSync(_name, data);
            await writeJson(name, date, length);

            console.log(' Json Saaved ! ');
            if (callback)
                await callback();
        } catch (e) {
            console.log(e);
        }
    }
}