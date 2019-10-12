const { myquery } = require('../helper/mysql');
const tableName = 'projectDir';

module.exports = {

    getProjectDir: async function (projectID) {
        const query = `
            SELECT dir
            FROM ${tableName}
            WHERE projectID = ?
        `;
        return myquery(query, [projectID])
    },

}