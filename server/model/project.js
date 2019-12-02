const { myquery } = require('../helper/mysql');
const tableName = 'project';
const projectDirTable = 'projectDir';
const projectDBTable = 'projectDB';

module.exports = {

    selectProjects: async() => {
        const query = `
            SELECT * 
            FROM ${tableName} 
        `;
        return myquery(query);
    },

    createProject: async name => {
        const query = `
            INSERT INTO ${tableName} 
            (name) 
            VALUES (?)
        `;
        return myquery(query, [name]);
    },

    searchProjectByName: async name => {
        const query = `
            SELECT * 
            FROM ${tableName} 
            WHERE name like ?`;
        return myquery(query, [`%${name}%`]);
    },

    selectProjectById: async projectID => {
        const query = `
            SELECT * 
            FROM ${tableName} 
            WHERE id = ?
        `;
        return myquery(query, [projectID])
            .then(result => result[0] || null);
    },

    selectProjectSize: async projectID => {
        const query = `
            SELECT count(*) as size 
            FROM object 
            WHERE FootPrint1 = ? 
            AND DataFlag3 = ?
        `;
        return myquery(query, [projectID, 1])
            .then(result => result[0].size || 0);
    },

    selectProjectDir: async projectID => {
        const query = `
            SELECT dir
            FROM ${projectDirTable}
            WHERE projectID = ?
        `;
        return myquery(query, [projectID]);
    },

    saveProjectDir: async(projectID, path) => {
        let query = `
            SELECT dir 
            FROM ${projectDirTable}
            WHERE projectID = ? 
        `;
        const existindDir = await myquery(query, [projectID]);

        if (existindDir && existindDir.length > 0) {
            query = `
                UPDATE ${projectDirTable} 
                SET dir = ? 
                WHERE projectID = ? 
            `;
            return myquery(query, [path, projectID]);
        } else {
            query = `
                INSERT INTO ${projectDirTable}
                (dir, projectID) 
                VALUES (?,?) 
            `;
            return myquery(query, [path, projectID]);
        }
    },

    selectProjectDB: async projectID => {
        const query = `
            SELECT * 
            FROM ${projectDBTable} 
            WHERE projectID = ?
        `;
        return myquery(query, [projectID])
            .then(result => result[0] || null);
    },

    saveProjectDB: async(options) => {
        const query = `
            INSERT INTO projectDB 
            (projectID, type, host, port, user, password, name) 
            VALUES (?,?,?,?,?,?,?)
        `;
        return myquery(query, options);
    },

    updateProjectDB: async({ projectID, type, host, port, user, password, name }) => {
        const query = `
            UPDATE projectDB SET
            type = ?,
            host = ?,
            port = ?,
            user = ?,
            password = ?,
            name = ?
            WHERE projectID = ?
        `;
        return myquery(query, [type, host, port, user, password, name, projectID]);
    },

}