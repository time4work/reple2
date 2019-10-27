const { myquery } = require('../helper/mysql');
const tableName = 'tmpl';
const keyTableName = 'tmplKey';
const valueTableName = 'tmplValue';
const relationTableName = 'tmplRelation';
const projectRelationtable = 'relationTmplProject';

module.exports = {

    selectTemplates: async (callback) => {
        return myquery(`
            SELECT * 
            FROM tmpl
        `, []);
    },

    selectTemplateById: async function (id) {
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
        return myquery(query, [id])
            .then(result => result[0] || null);
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

    selectProjectTemplatesRelation: async function (projectID, type) {
        const query = `
			SELECT *
			FROM ${projectRelationtable}
            WHERE projectID = ? AND type = ?
        `;
        return myquery(query, [projectID, type]);
    },

    selectProjectTemplates: async (projectID, callback) => {
        const query = `
            SELECT 
            res.id, res.title, type 
            FROM relationTmplProject 
            LEFT JOIN (SELECT id, title FROM tmpl) AS res 
            ON res.id = tmplID 
            WHERE projectID = ? 
        `;
        return myquery(query, [projectID]);
    },

}
