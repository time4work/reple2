const { myquery } = require('../helper/mysql');

module.exports = {

    createLibraryKey: async (name, callback) => {
        try {
            const query = "INSERT INTO libraryKey (`name`) VALUES (?)";
            const result = await myquery(query, [name]);

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
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
                    return {
                        key: key,
                        values: []
                    };
                });

            result.forEach((item, i, arr) => {
                const _key = result[i].key;

                for (let j = 0; j < list.length; j++) {

                    if (list[j].key == _key) {
                        list[j].id = item.keyID;

                        if (item.value != null)
                            list[j].values.push({ id: item.valueID, value: item.value });
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

    importLibrary: async (json, callback) => {
        try {
            const query = "SELECT * FROM libraryKey WHERE name = ? ";
            const query2 = "SELECT * FROM libraryValue WHERE id = ? ";
            const query3 = "SELECT * FROM libraryRelation WHERE keyID = ?";
            const query4 = "INSERT INTO libraryKey(`name`) VALUES (?)";
            const query5 = "INSERT INTO libraryValue(`value`) VALUES (?)";
            const query6 = "INSERT INTO libraryRelation(`keyID`, `valueID`) VALUES (?,?)";

            for (key in json) {
                const keyResult = await myquery(query, [key]);

                if (keyResult.length == 0) {
                    const keyResult2 = await myquery(query4, [key]);
                    keyId = keyResult2.insertId;

                } else {
                    keyId = keyResult[0].id;
                }

                const values = json[key];

                for (let i = 0; i < values.length; i++) {
                    const value = values[i];
                    const relationResult = await myquery(query3, [keyId]);

                    if (relationResult.length == 0) {
                        const valueResult = await myquery(query5, [value]);
                        const valueId = valueResult.insertId;
                        await myquery(query6, [keyId, valueId]);

                    } else {
                        let flag = true;

                        for (let j = 0; j < relationResult.length; j++) {

                            if (!flag) {
                                continue;
                            }
                            const tmpId = relationResult[j].valueID;
                            const relationValueResult = await myquery(query2, [tmpId]);

                            if (relationValueResult.length == 0) {
                                continue;

                            } else if (relationValueResult[0].value == value) {
                                flag = false;

                            } else {
                                continue;
                            }
                        }

                        if (flag) {
                            const valueResult = await myquery(query5, [value]);
                            const valueId = valueResult.insertId;
                            await myquery(query6, [keyId, valueId]);
                        }
                    }
                }
            }

            const result = 'finished';

            if (callback) await callback(result);
            return result;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteLibraryKey: async (keyID, callback) => {
        try {
            await new Promise(async (resolve, reject) => {
                const query = `
                    SELECT valueID FROM libraryRelation
                    WHERE keyID = ? 
                `;
                const result = await myquery(query, [keyID]);
                resolve(result);

            }).then(async (values) => {

                for (var i = 0; i < values.length; i++) {
                    const query = `
                        DELETE FROM libraryValue
                        WHERE id = ? 
                    `;
                    const result2 = await myquery(query, [values[i].valueID]);
                }
                return;

            }).then(async () => {

                const query = `
                    DELETE FROM libraryRelation
                    WHERE keyID = ? 
                `;
                const result3 = await myquery(query, [keyID]);
                return;

            }).then(async () => {

                const query = `
                    DELETE FROM libraryKey
                    WHERE id = ? 
                `;
                const result4 = await myquery(query, [keyID]);

            }).catch((e) => {
                console.log('my promis error');
                console.log(e);
            })

            if (callback) await callback();
            return;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    addLibraryKeyValue: async (value, callback) => {
        try {
            const query = "INSERT INTO libraryValue (`value`) VALUES (?)";
            const result = await myquery(query, [value]);

            if (callback) await callback(result.insertId);
            return result.insertId;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    createRelationLibraryKeyValue: async (keyID, valueID, callback) => {
        try {
            const query = "INSERT INTO libraryRelation (`keyID`,`valueID`) VALUES (?,?)";
            const result = await myquery(query, [keyID, valueID]);

            if (callback) await callback(result.insertId);
            return result.insertId;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

    deleteLibraryKeyValue: async (valueID, callback) => {
        try {
            await new Promise(async (resolve, reject) => {

                const query = `
                    DELETE FROM libraryRelation
                    WHERE valueID = ? 
                `;
                const result3 = await myquery(query, [valueID]);
                resolve();

            }).then(async () => {

                const query = `
                    DELETE FROM libraryValue
                    WHERE id = ? 
                `;
                const result2 = await myquery(query, [valueID]);
                return;

            }).catch((e) => {
                console.log('my promis error');
                console.log(e);
            })

            if (callback) await callback();
            return;

        } catch (e) {
            console.log(e);
            return 0;
        }
    },

}