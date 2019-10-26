const { myquery } = require('../helper/mysql');
const keyTableName = 'tmplKey';
const valueTableName = 'tmplValue';
const relationTableName = 'tmplRelation';
const projectRelationtable = 'relationTmplProject';

module.exports = {

    selectTemplate: async function (id) {
        const query = `
            SELECT res.keyID, a.keyword, b.id, b.value AS 'val'
            FROM ${relationTableName} res 
            LEFT JOIN ( 
                SELECT * 
                FROM  ${keyTableName} 
            ) AS a ON a.id = res.keyID
            LEFT JOIN ( 
                SELECT * 
                FROM ${valueTableName} 
            ) AS b ON b.keyID = a.id 
            WHERE res.tmplID = ?
            ORDER BY a.keyword
        `; 
        return myquery(query, [id]);
    },

    selectProjectTitleTmplSize: async function (projectID) {
        const query = `
            SELECT COUNT(*)
            FROM ${projectRelationtable}
            WHERE projectID = ? AND type = 'title'
        `;
        return myquery(query, [projectID]);
    },

    selectProjectDescriptionTmplSize: async function (projectID) {
        const query = `
            SELECT COUNT(*)
            FROM ${projectRelationtable}
            WHERE projectID = ? AND type = 'description'
        `;
        return myquery(query, [projectID]);
    },

    selectProjectTemplates: async function (projectID, type) {
        const query = `
			SELECT *
			FROM ${projectRelationtable}
            WHERE projectID = ? AND type = ?
        `;
        return myquery(query, [projectID, type]);
    },

}
