const { myquery } = require('../helper/mysql');

module.exports = {

    selectProject: async (id, callback) => {
        try {
            const query = `SELECT * FROM project WHERE id = ?`;
            const result = await myquery(query, [id]);

            if (callback)
                await callback(result[0]);
            return result[0];

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectDir: async (projectID, callback) => {
        try {
            const query = `
                SELECT 
                dir 
                FROM projectDir 
                WHERE projectID = ? 
            `;
            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectJson: async (projectID, callback) => {
        try {
            const query = `
                SELECT 
                j.name 
                FROM relationProjectJson AS r 
                INNER JOIN jsonFiles AS j 
                ON r.jsonID = j.id 
                WHERE r.projectID = ? 
            `;
            const result = await myquery(query, [projectID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectAllJsons: async (callback) => {
        try {
            const query = `SELECT * FROM jsonFiles`;
            const result = await myquery(query);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectsRelation: async (callback) => {
        try {
            const result = [];
            const query = `SELECT * FROM project`;
            const projects = await myquery(query, []);

            for (var i = 0; i < projects.length; i++) {
                const project = {};
                project.id = projects[i].id;
                project.name = projects[i].name;

                // TODO: generator-task                
                project.size = null;

                result.push(project);
            }

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    searchProject: async (name, callback) => {
        try {
            const query = `SELECT * FROM project WHERE name like ?`;
            const result = await myquery(query, ['%' + name + '%']);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    createProject: async (name, callback) => {
        try {
            const query = `INSERT INTO project (name) VALUES (?)`;
            const result = await myquery(query, [name]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveProjectDB: async (projectID, pack) => {
        const options = [];
        const type = pack.db_type || 'localhost';
        const host = pack.db_adr || null;
        const port = pack.db_port || null;
        const user = pack.db_usr || null;
        const password = pack.db_pass || null;
        const name = pack.db_name || null;
        options.push(type, host, port, user, password, name);

        const projectDB = await myquery(
            `SELECT * FROM projectDB WHERE projectID = ?`, 
            [projectID]
        );

        if (!projectDB || !projectDB.length) {
            // create new 
            options.unshift(projectID);
            return myquery(`
                INSERT INTO projectDB 
                (projectID, type, host, port, user, password, name) 
                VALUES (?,?,?,?,?,?,?)
            `, options);
        } else {
            // update existing one
            options.push(projectID);
            return myquery(`
                UPDATE projectDB SET
                type = ?,
                host = ?,
                port = ?,
                user = ?,
                password = ?,
                name = ?
                WHERE projectID = ?
            `, options);
        }
    },

    selectProjectDB: async (projectID) => {
        const result = await myquery(
            `SELECT * FROM projectDB WHERE projectID = ?`, 
            [projectID]
        );
        return result && result.length
            ? result[0]
            : null;
    },

    selectProjectUnmappedObjects: async (projectID, callback) => {
        try {
            // TODO: refactor - generator-task

            // const query = `
            //     SELECT * FROM object
            //     WHERE id in
            //     (
            //         SELECT objectID
            //         FROM relationProjectObject
            //         WHERE projectID = ?
            //     )
            //     AND DataFlag1 IS NULL
            //     AND DataFlag2 IS NULL
            // `;
            // const result = await myquery(query, [projectID]);
            const result = [];

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectReadyObjects: async (objects, callback) => {
        const x = [];
        // TODO: refactor - generator-task

        // for (var i = 0; i < objects.length; i++) {
        //     if (
        //         objects[i].DataLink2 &&
        //         objects[i].DataLink3 &&
        //         objects[i].DataLink4 &&
        //         objects[i].DataText3
        //     ) {
        //         x.push(objects[i]);
        //     }
        // }

        if (callback) await callback(x);
        return x;
    },

    selectProjectReadyObjectLength: async (objects, callback) => {
        let x = 0;
        // TODO: refactor - generator-task

        // for (let i = 0; i < objects.length; i++) {
        //     if (objects[i].DataLink2 && objects[i].DataLink3 && objects[i].DataLink4 && objects[i].DataText3)
        //         x++;
        // }

        if (callback) await callback(x);
        return x;
    },

    selectProjectObjects: async (projectID, callback) => {
        try {
            // TODO: refactor - generator-task

            // const query = `
            //     SELECT * 
            //     FROM object 
            //     WHERE id IN 
            //     (SELECT objectID 
            //     FROM relationProjectObject 
            //     WHERE projectID = ?) 
            //     `;
            // const result = await myquery(query, [projectID]);
            const result = [];

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjects: async (callback) => {
        try {
            const query = `SELECT * FROM project`;
            const result = await myquery(query, []);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectSize: async (id, callback) => {
        try {
            const query = `
                SELECT count(*) as size 
                FROM object 
                WHERE FootPrint1 = ? 
                AND DataFlag3 = ?
            `;
            const queryResult = await myquery(query, [id, true]);
            const result = queryResult[0].size;
            // const query = `SELECT count(*) FROM relationProjectObject WHERE projectID = ?`;
            // const size = await myquery(query, [id]);
            // const result = size[0]['count(*)'];
            // const result = 0;

            if (callback)
                await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveProjectDir: async (projectID, dir, callback) => {
        try {
            let result;
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
                result = await myquery(query, [dir, projectID]);
            } else {
                query = `
                    INSERT INTO projectDir
                    (dir, projectID) 
                    VALUES (?,?) 
                `;
                result = await myquery(query, [dir, projectID]);
            }

            if (callback) callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectProjectTmpls: async (projID, callback) => {
        try {
            const query = `
                SELECT 
                res.id, res.title, type 
                FROM relationTmplProject 
                LEFT JOIN (SELECT id, title FROM tmpl) AS res 
                ON res.id = tmplID 
                WHERE projectID = ? 
            `;
            const result = await myquery(query, [projID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveProjectChanges: async (id, name, info, t_tmpls, d_tmpls, jsons, db, callback) => {
        try {
            // TODO: REFACTOR

            if (!name) return

            let query = `
                UPDATE project 
                SET name = ?, description = ? 
                WHERE id = ? 
            `;
            const base_save = await myquery(query, [name, info, id]);

            if (jsons && jsons.length != 0) {
                query = `
                    DELETE 
                    FROM relationProjectJson 
                    WHERE projectID = ? 
                `;
                const deleted_jsons = await myquery(query, [id]);

                query = `
                    INSERT INTO 
                    relationProjectJson(projectID, jsonID) 
                    VALUES(?,?) 
                `;
                for (let i = 0; i < jsons.length; i++) {
                    const jsons_res = await myquery(query, [id, jsons[i]]);
                }
            }

            query = `
                SELECT tmplID 
                FROM relationTmplProject 
                WHERE projectID = ? AND type = 'title' 
            `;
            const p_tmpls_res = await myquery(query, [id]);

            const p_tmpls = [];
            for (var i = 0; i < p_tmpls_res.length; i++) {
                await p_tmpls.push(p_tmpls_res[i].tmplID);
            }

            const new_tmpls = [];
            const lost_tmpls = [];

            if (!t_tmpls) t_tmpls = [];

            for (let i = 0; i < t_tmpls.length; i++) {
                if (p_tmpls.indexOf(t_tmpls[i]) < 0)
                    await new_tmpls.push(t_tmpls[i])
            }

            for (let i = 0; i < p_tmpls.length; i++) {
                if (t_tmpls.indexOf(p_tmpls[i]) < 0)
                    await lost_tmpls.push(p_tmpls[i])
            }

            query = `
                INSERT INTO 
                relationTmplProject(tmplID, projectID, type) 
                VALUES(?,?,?) 
            `;
            for (let i = 0; i < new_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [new_tmpls[i], id, 'title']);
            }

            query = `
                DELETE FROM 
                relationTmplProject 
                WHERE tmplID = ? 
                AND projectID = ? AND type = 'title' 
            `;
            for (let i = 0; i < lost_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [lost_tmpls[i], id]);
            }

            query = `
                SELECT tmplID 
                FROM relationTmplProject 
                WHERE projectID = ? AND type = 'description' 
            `;
            const _p_tmpls_res = await myquery(query, [id]);

            const _p_tmpls = [];
            for (let i = 0; i < _p_tmpls_res.length; i++) {
                await _p_tmpls.push(_p_tmpls_res[i].tmplID);
            }

            const _new_tmpls = [];
            const _lost_tmpls = [];

            if (!d_tmpls)
                d_tmpls = [];

            for (let i = 0; i < d_tmpls.length; i++) {
                if (_p_tmpls.indexOf(d_tmpls[i]) < 0)
                    await _new_tmpls.push(d_tmpls[i])
            }
            for (let i = 0; i < _p_tmpls.length; i++) {
                if (d_tmpls.indexOf(_p_tmpls[i]) < 0)
                    await _lost_tmpls.push(_p_tmpls[i])
            }

            query = `
                INSERT INTO 
                relationTmplProject(tmplID, projectID, type) 
                VALUES(?,?,?) 
            `;
            for (let i = 0; i < _new_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [_new_tmpls[i], id, 'description']);
            }

            query = `
                DELETE FROM relationTmplProject 
                WHERE tmplID = ? 
                AND projectID = ? AND type = 'description' 
            `;
            for (let i = 0; i < _lost_tmpls.length; i++) {
                const tmpl_res = await myquery(query, [_lost_tmpls[i], id]);
            }

            if (callback) await callback();

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteProject: async (projectID) => {
        //! TODO: delete-ptoject-task         
    },

}