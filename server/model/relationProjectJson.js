const { myquery } = require('../helper/mysql');
const tableName = 'relationProjectJson';

module.exports = {

    selectProjectJsonNames: async function (projectID) {
        const query = `
            SELECT *
            FROM replecon.jsonFiles
            WHERE id in
            (
                SELECT jsonID 
                FROM ${tableName}
                WHERE projectID = ?
            )
        `;
        return myquery(query, [projectID])
    },

    selectProjectJsonSize: async function (projectID) {
        const query = `
            SELECT count(*)
            FROM replecon.jsonFiles
            WHERE id in
            (
                SELECT jsonID 
                FROM ${tableName}
                WHERE projectID = ?
            )
        `;
        return myquery(query, [projectID])
    },
};