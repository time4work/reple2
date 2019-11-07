const { myquery } = require('../helper/mysql');
const tableName = 'object';

module.exports = {

    selectObjectByLinkAndProject: async function (projectID, pageLink) {
        const query = `
            SELECT *
            FROM ${tableName}
            WHERE FootPrint1 = ?
            AND DataLink1 = ?
        `;
        return myquery(query, [projectID, pageLink]);
    },

    createObject: async function (projectID, pageLink) {
        const query = `
            INSERT INTO ${tableName} 
            (FootPrint1, DataLink1) 
            VALUES (?,?)
        `;
        return myquery(query, [projectID, pageLink]);
    },

    updateObjectProp: async function (id, options) {
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

        return myquery(query, [...values, id]);
    },

    getProjectReadyObject: async projectID => {
        const query = `
            SELECT *
            FROM ${tableName}
            WHERE FootPrint1 = ?
            AND DataFlag3 = ?
            AND DataLink1 <> ?
        `;
        return myquery(query, [projectID, 1, 1]);
    },

    selectProjectReadyObjectsCount: async projectId => {
        const query = `
            SELECT COUNT(*) AS count 
            FROM ${tableName} 
            WHERE FootPrint1 = ?
            AND DataFlag3 = 1 
            AND (
                DataFlag1 <> 1 OR DataFlag1 IS NULL
            )
            AND (
                DataFlag2 <> 1 OR DataFlag2 IS NULL
            )
        `;
        return myquery(query, [projectId])
            .then(res => res[0].count);
    },

    selectProjectPublishedObjectsCount: async projectId => {

        const query = `
            SELECT COUNT(*) AS count 
            FROM ${tableName} 
            WHERE FootPrint1 = ? 
            AND DataFlag1 = 1 
        `;
        return await myquery(query, [projectId])
            .then(res => res[0].count);
    },

}