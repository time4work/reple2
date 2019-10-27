const { myquery } = require('../helper/mysql');
const tableName = 'jsonFiles';
const projectRelationTable = 'relationProjectJson';

module.exports = {

    selectJsons: async function (id) {
        const query = `
            SELECT * 
            FROM ${tableName}
        `;
        return myquery(query, []);
    },

    selectJsonName: async function (id) {
        const query = `
            SELECT name 
            FROM ${tableName}
            WHERE id = ?
        `;
        return myquery(query, [id]);
    },

    selectProjectJsons: async function (projectID) {
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
        return myquery(query, [projectID]);
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
        return myquery(query, [projectID]);
    },

}