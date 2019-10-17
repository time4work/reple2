const { myquery } = require('../helper/mysql');
const fs = require('fs');

const path = './json/';

async function writeJson(name, date, size, callback) {
    try {
        const query = `INSERT INTO jsonFiles (name, date, size) VALUES (?,?,?)`;
        const result = await myquery(query, [name, date, size]);

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
            const query = `SELECT * FROM jsonFiles`;
            const result = await myquery(query, []);

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
            const query = `
                SELECT * 
                FROM jsonFiles 
                WHERE id = ? 
                `;

            const result = await myquery(query, [id]);

            if (callback)
                await callback(result);

            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveJson: async (json, name, callback) => {
        try {
            const length = json.length;
            const data = JSON.stringify(json);
            const date = new Date();
            const _name = `${path}${name}`;

            await fs.writeFile(_name, data);
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

            const select_query = `
            SELECT name 
            FROM jsonFiles 
            WHERE id = ? 
            `;
            const jsonName = await myquery(select_query, [id]);

            if (!jsonName || !jsonName.length) {
                if (callback)
                    callback(null);

                return null;
            }

            const delete_dep_query = `
            DELETE 
            FROM relationProjectJson 
            WHERE jsonID = ?`;
            const dep_result = await myquery(delete_dep_query, [id]);

            const delete_query = `DELETE 
            FROM jsonFiles 
            WHERE id = ?`;
            const result = await myquery(delete_query, [id]);

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