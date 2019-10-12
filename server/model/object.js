const { myquery } = require('../helper/mysql');
const tableName = 'object';

module.exports = {

    getObjectByLinkAndProject: async function (projectID, pageLink) {
        const query = `
            SELECT *
            FROM ${tableName}
            WHERE FootPrint1 = ?
            AND DataContext = ?
        `;
        return myquery(query, [projectID, pageLink]);
    },

    createObject: async function (projectID, pageLink) {
        const query = `
            SELECT *
            FROM ${tableName}
            WHERE FootPrint1 = ?
            AND DataContext = ?
        `;
        return myquery(query, [projectID, pageLink]);
    },

    updateObjectViaOptions: async function (id, options) {
        const keys = Object.keys(options);
        const values = [];
        
        let query = `UPDATE ${tableName} SET `;

        for (let i=0; i<keys.length; i++) {
            const key = keys[i];
            if (i !== 0) {
                query += ' AND ';
            }
            query += ` ${key} = ? `;
            values.push(options[key]);
        }
        query += 'WHERE id = ?';

        return myquery(query, values);
    }
}