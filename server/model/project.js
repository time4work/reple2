const { myquery } = require('../helper/mysql');
const tableName = 'project';
const projectDirTable = 'projectDir';

module.exports = {
    
    selectProjectDir: async function (projectID) {
        const query = `
            SELECT dir
            FROM ${projectDirTable}
            WHERE projectID = ?
        `;
        return myquery(query, [projectID])
    },

}