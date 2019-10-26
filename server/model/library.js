const { myquery } = require('../helper/mysql');
const keyTableName = 'libraryKey';
const valueTableName = 'libraryValue';
const relationTableName = 'libraryRelation';

module.exports = {

    selectLibrary: async function () {
        const query = ` 
            SELECT r.id AS 'keyID', r.name AS 'key', res2.id AS 'valueID', res2.value
            FROM ${keyTableName} r
            LEFT JOIN
            (
                SELECT *
                FROM ${relationTableName}
            ) AS res ON res.keyID = r.id
            LEFT JOIN
            (
            	SELECT *
            	FROM  ${valueTableName}
            ) AS res2 ON res2.id = res.valueID
        `;
        return myquery(query, null);
    },

}