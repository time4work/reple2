const { myquery } = require('../helper/mysql');
const tableName = 'jsonFiles';

module.exports = {
    getJsonName: async function (id) {
        const query = `
            SELECT name 
            FROM ${tableName} 
            WHERE id = ?
        `;
        return myquery(query, [id])
    },

}