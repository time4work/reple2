const { myquery } = require('../helper/mysql');
const tableName = 'jsonFiles';
const projectRelationTable = 'relationProjectJson';

module.exports = {

    getJsonName: async function (id) {
        const query = `
            SELECT name 
            FROM ${tableName} 
            WHERE id = ?
        `;
        return myquery(query, [id])
    },

    selectProjectJsonNames: async function (projectID) {
        const query = `
            SELECT *
            FROM ${tableName}
            WHERE id IN
            (
                SELECT jsonID 
                FROM ${projectRelationTable}
                WHERE projectID = ?
            )
        `;
        return myquery(query, [projectID])
    },

    selectProjectJsonSize: async function (projectID) {
        const query = `
            SELECT COUNT(*)
            FROM ${tableName}
            WHERE id IN
            (
                SELECT jsonID 
                FROM ${projectRelationTable}
                WHERE projectID = ?
            )
        `;
        return myquery(query, [projectID])
    },

}