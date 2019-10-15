const { myquery } = require('../helper/mysql');
const fs = require('fs');

const path = './json/';

async function writeJson(name, date, size, callback) {
    try {
        let query = `INSERT INTO jsonFiles (name, date, size) VALUES (?,?,?)`;
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

    getJsons: async (callback) => {
        try {
            let query = `SELECT * FROM jsonFiles`;
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

    getJson: async (id, callback) => {
        try {
            let query = `
                SELECT * 
                FROM jsonFiles 
                WHERE id = ? 
                `;

            let result = await myquery(query, [id]);

            if (callback)
                await callback(result);

            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    importJson: async (json, callback) => {
        try {
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
                            });
                        return res(connection);
                    } else return res(connection);
                });
            }

            console.log(' Json Loaded ! ');
            connection.end();
            console.log('x x x x x x x - connection.end');

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
            var _name = `${path}${name}`;

            await fs.writeFileSync(_name, data);
            await writeJson(name, date, length);

            console.log(' Json Saaved ! ');

            if (callback)
                await callback();

        } catch (e) {
            console.log(e);
        }
    },

    deleteJson: async (id, callback) => {
        try {

            let select_query = `
            SELECT name 
            FROM jsonFiles 
            WHERE id = ? 
            `;
            let jsonName = await myquery(select_query, [id]);

            if (!jsonName || !jsonName.length) {
                if (callback)
                    callback(null);

                return null;
            }

            let delete_dep_query = `
            DELETE 
            FROM relationProjectJson 
            WHERE jsonID = ?`;
            let dep_result = await myquery(delete_dep_query, [id]);

            let delete_query = `DELETE 
            FROM jsonFiles 
            WHERE id = ?`;
            let result = await myquery(delete_query, [id]);

            fs.unlinkSync(`${path}${jsonName[0].name}`);

            if (callback)
                await callback(result);

            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    }
}