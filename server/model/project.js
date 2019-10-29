const { myquery } = require('../helper/mysql');
const tableName = 'project';
const projectDirTable = 'projectDir';

module.exports = {
    
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
            FROM project 
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

    saveProjectDir: async (projectID, path) => {
        let query = `
            SELECT dir 
            FROM projectDir 
            WHERE projectID = ? 
        `;
        const existindDir = await myquery(query, [projectID]);

        if (existindDir && existindDir.length > 0) {
            query = `
                UPDATE projectDir 
                SET dir = ? 
                WHERE projectID = ? 
            `;
            return myquery(query, [path, projectID]);
        } else {
            query = `
                INSERT INTO projectDir
                (dir, projectID) 
                VALUES (?,?) 
            `;
            return myquery(query, [path, projectID]);
        }
    },

    selectProjectDB: async projectID => {
        const query = `
            SELECT * 
            FROM projectDB 
            WHERE projectID = ?
        `;
        return myquery(query, [projectID])
            .then(result => result[0] || null);
    }
}