const { myquery } = require('../helper/mysql');
const tableName = 'relationTmplProject';

module.exports = {

    getProjectTitleTmplSize: async function (projectID) {
        const query = `
            SELECT count(*)
            FROM ${tableName}
            WHERE projectID = ? AND type = 'title'
        `;
        return myquery(query, [projectID])
    },

    getProjectDescriptionTmplSize: async function (projectID) {
        const query = `
            SELECT count(*)
            FROM ${tableName}
            WHERE projectID = ? AND type = 'description'
        `;
        return myquery(query, [projectID])
    },

}