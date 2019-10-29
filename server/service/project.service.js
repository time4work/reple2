const path = require('path');
const { myquery } = require('../helper/mysql');
const { selectDir, simpleSort } = require('../helper');
const { getProjectReadyObject } = require('../model/object');
const {
    createProject,
    selectProjectById,
    selectProjectSize,
    selectProjectDir,
    saveProjectDir,
    selectProjectDB,
    searchProjectByName,
} = require('../model/project');
const {
    selectTemplates,
    selectProjectTemplates,
} = require('../model/template');
const {
    selectProjectJsons,
    selectJsons,
} = require('../model/json');

const DEFAULT_SCREENS_PATH = './screens';

module.exports = {

    createProject: async (name) => {
        return createProject(name);
    },

    getProjectObjects: async project_id => {
        const objects = await getProjectReadyObject(project_id);
        return {
            project: {
                id: project_id
            },
            objects,
        };
    },

    getProject: async project_id => {
        const project = await selectProjectById(project_id);
        const size = await selectProjectSize(project_id);
        const tmpls = await selectTemplates();
        const tmplRelation = await selectProjectTemplates(project_id);
        const jsons = await selectProjectJsons(project_id);
        const jsonsAvailable = await selectJsons();

        return {
            project,
            size,
            tmpls,
            tmplRelation,
            jsons,
            jsonsAvailable,
        }
    },

    showProjectScreensDir: async project_id =>
        new Promise(async (resolve, reject) => {
            const select_dir_result = await selectProjectDir(project_id);

            let fullpath;

            if (select_dir_result.length === 0)
                fullpath = path.resolve(DEFAULT_SCREENS_PATH);
            else
                fullpath = select_dir_result[0].dir;

            const pathList = selectDir(fullpath);
            if (fullpath != '/') {
                pathList.push('..');
            }
            pathList.sort(simpleSort);
            resolve({ list: pathList, path: fullpath });
        }),

    navigateProjectScreensDir: async options =>
        new Promise((resolve, reject) => {
            const { curpath, way } = options;
            const fullpath = path.join(curpath, way);

            const pathList = selectDir(fullpath);
            if (fullpath != '/') {
                pathList.push('..');
            }
            pathList.sort(simpleSort);
            resolve({ list: pathList, path: fullpath });
        }),

    saveProjectSceenDir: async (project_id, path) =>
        new Promise(async (resolve, reject) => {
            // check path exist
            const list = selectDir(path);
            if (!list) reject('wrong PATH');

            await saveProjectDir(project_id, path)
                .then(() => resolve())
                .catch(e => reject(e));
        }),

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

    searchProjects: async name => searchProjectByName(name),

    // TODO: REFACTOR
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

    getProjectDB: async project_id => {
        return selectProjectDB(project_id)
            .then(db => {
                return {
                    dbhost: db,
                    project: {
                        id: project_id,
                    },
                }
            });
    },

    // TODO: REFACTOR
    saveProjectChanges: async (id, name, info, t_tmpls, d_tmpls, jsons, db, callback) => {
        try {

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

    selectProjectReadyObjectsCount: async (projectId, callback) => {

        const query = `
        SELECT COUNT(*) AS count 
        FROM object o 
        INNER JOIN relationProjectObject r 
        ON r.objectId = o.id 
        WHERE r.projectID = ? 
        AND o.DataFlag1 = 0 
        `;

        const res = await myquery(query, [projectId]);

        if(callback)
            callback(res[0].count);

        return res[0].count;
    },

    selectProjectPublishedObjectsCount: async (projectId, callback) => {

        const query = `
        SELECT COUNT(*) AS count 
        FROM object o 
        INNER JOIN relationProjectObject r 
        ON r.objectId = o.id 
        WHERE r.projectID = ? 
        AND o.DataFlag1 = 1 
        `;

        const res = await myquery(query, [projectId]);

        if(callback)
            callback(res[0].count);

        return res[0].count;
    }
}