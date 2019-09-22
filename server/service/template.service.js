const { myquery } = require('../helper/mysql');

module.exports = {

    selectTmpl: async (tmplID, callback) => {
        try {
            const query = "SELECT * FROM tmpl WHERE id = ?";
            const result = await myquery(query, [tmplID]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectTmpls: async (callback) => {
        try {
            const query = "SELECT * FROM tmpl";
            const result = await myquery(query, []);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    searchTmpl: async (name, callback) => {
        try {

            const query = "SELECT * FROM tmpl WHERE title like ?";
            const result = await myquery(query, ['%' + name + '%']);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    importTemplate: async (name, json, callback) => {
        try {
            const check_query = " SELECT * FROM tmpl WHERE title = ? ";
            const tmpl_search_result = await myquery(check_query, [name]);
            let tmpl_name;

            if (!tmpl_search_result.length == 0) {
                let i = 1;
                while (true) {
                    let tmp_name = `${name}(${i})`;
                    const name_search_result = await myquery(check_query, [tmp_name]);
                    if (name_search_result.length == 0) {
                        tmpl_name = tmp_name;
                        break;
                    } else {
                        i++;
                    }
                }
            } else {
                tmpl_name = name;
            }

            const tmpl_query = "INSERT INTO tmpl(`title`) VALUES(?)";
            const tmpl_result = await myquery(tmpl_query, [tmpl_name]);
            const tmpl_id = tmpl_result.insertId;

            const key_query = "INSERT INTO tmplKey(`keyword`) VALUES (?)";
            const val_query = "INSERT INTO tmplValue(`value`, keyID) VALUES (?, ?)";
            const rel_query = "INSERT INTO tmplRelation(`tmplID`, `keyID`) VALUES (?,?)";

            for (key in json) {
                const key_result = await myquery(key_query, [key]);
                const key_id = key_result.insertId;

                const rel_result = await myquery(rel_query, [
                    tmpl_id,
                    key_id,
                ]);

                const values = json[key];
                for (let i = 0; i < values.length; i++) {
                    const val_result = await myquery(val_query, [values[i], key_id]);
                    const val_id = val_result.insertId;
                }
            }

            const result = `template ${tmpl_name} imported`;

            if (callback) await callback(result);
            return result;
        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    createTmpl: async (title, callback) => {
        try {
            const query = "INSERT INTO tmpl(`title`) VALUES(?)";
            const result = await myquery(query, [title]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteTmpl: deleteTmpl = async (tmplID, callback) => {
        try {
            const proj_rel_result = await myquery(`
                DELETE FROM relationTmplProject WHERE tmplID = ?
            `, [tmplID]);

            const rel_select_result = await myquery(`
                SELECT keyID FROM tmplRelation WHERE tmplID = ?
            `, [tmplID]);

            const rel_delete_result = await myquery(`
                DELETE FROM tmplRelation WHERE tmplID = ?
            `, [tmplID]);

            for (let i = 0; i < rel_select_result.length; i++) {
                const keyID = rel_select_result[i].keyID;

                const key_result = await myquery(`
                    DELETE FROM tmplKey WHERE id = ?
                `, [keyID]);

                const val_result = await myquery(`
                    DELETE FROM tmplValue WHERE keyID = ?
                `, [keyID]);
            }

            const tmpl_result = await myquery(`
                DELETE FROM tmpl WHERE id = ?
            `, [tmplID]);

            result = true;

            if (callback) await callback(result);

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    selectTmplKeys: selectTmplKeys = async (tmplID, callback) => {
        try {
            const result = await selectTmplKeysHelperFunction(tmplID);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    formatTMPL: formatTMPL = async (keys) => {
        const tmpl = {};

        if (!keys || !keys.length) return [];

        await keys.map((item) => {
            tmpl[item['keyword']] = {
                id: item.keyID,
                values: item.values ? item.values : []
            };
        });
        return tmpl;
    },

    selectLibraryItems: selectLibraryItems = async (callback) => {
        try {
            const query = ""
                + " SELECT r.id as `keyID`, r.name as `key`, res2.id as `valueID`, res2.value "
                + " FROM replecon.libraryKey r "
                + " left join "
                + " 	( "
                + " 		select * "
                + " 		from  replecon.libraryRelation "
                + " 	) as res on res.keyID = r.id  "
                + " left join "
                + " ( "
                + " 	select * "
                + " 	from  replecon.libraryValue "
                + " ) as res2 on res2.id = res.valueID ";
            const result = await myquery(query, []);

            const list = [...new Set(result.map(item => item.key))]
                .map((key) => {
                    return { key: key, values: [] }
                });
            result.forEach((item, i, arr) => {
                const _key = result[i].key;

                for (let j = 0; j < list.length; j++) {

                    if (list[j].key == _key) {
                        list[j].id = item.keyID;

                        if (item.value != null) {
                            list[j].values.push({
                                id: item.valueID,
                                value: item.value
                            });
                        }
                    }
                }
            });

            if (callback) await callback(list);
            return list;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    saveTmplChanges: async (tagID, name, callback) => {
        try {
            const query = "UPDATE tmpl SET title=? WHERE id=?;";
            const result = await myquery(query, [name, tagID]);

            if (callback) await callback();

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    createTmplKey: createTmplKey = async (tmplID, keyword, callback) => {
        try {
            const tmplKeyID = await createTmplKeyHelperFunction(tmplID, keyword);

            if (!tmplKeyID) return false;

            if (callback) await callback(true);
            return true

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteTmplKey: deleteTmplKey = async (keyID, callback) => {
        try {
            const val_result = await myquery(
                "DELETE FROM tmplValue WHERE keyID = ?",
                [keyID],
            );

            const rel_result = await myquery(
                "DELETE FROM tmplRelation WHERE keyID = ?"
                , [keyID]);

            const key_result = await myquery(
                "DELETE FROM tmplKey WHERE id = ?"
                , [keyID]);

            if (callback) await callback(key_result);
            return key_result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    createTmplValue: async (keyID, value, callback) => {
        try {
            const val_result = await myquery(`
                INSERT INTO 
                tmplValue (keyID, value) 
                values (?,?)
            `, [keyID, value]);

            if (val_result) {

                if (callback)
                    await callback(val_result.insertId);
                return val_result.insertId;

            } else {

                if (callback) await callback(null);
                return null;
            }

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteTmplValue: async (valID, callback) => {
        try {
            const val_result = await myquery(
                "DELETE FROM tmplValue WHERE id = ?"
                , [valID]);
            const result = val_result ? true : false;

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

}

async function selectTmplKeysHelperFunction(tmplID) {
    try {
        const result = await myquery(`
			SELECT 
			rel.tmplID, 
			rel.id AS 'relID', 
			rel.keyID, 
			k.keyword
			FROM replecon.tmplRelation rel
			INNER JOIN(
				SELECT *
				FROM replecon.tmplKey
			) AS k ON k.id = rel.keyID
			WHERE rel.tmplID = ?
			ORDER BY k.keyword
		`, [tmplID]);

        for (let i = 0; i < result.length; i++) {
            const key = result[i];
            const values = await myquery(`
				SELECT id, value
				FROM replecon.tmplValue
				WHERE keyID = ?
            `, [key.keyID]);

            if (values.length != 0) {
                result[i].values = values;
            }
        }

        return result;

    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function createTmplKeyHelperFunction(tmplID, key) {
    try {
        const key_query = "INSERT INTO tmplKey (keyword) values (?)";
        const key_result = await myquery(key_query, [key]);
        const key_id = key_result.insertId;

        const rel_query = "INSERT INTO tmplRelation (tmplID, keyID) values (? ,?)";
        const rel_result = await myquery(rel_query, [tmplID, key_id]);

        return rel_result.insertId;

    } catch (e) {
        console.log(e);
        return 0;
    }
}