
class RECommonFunctions {
    static async checkAuthorizationM(req, res, next) {
        let inputKey = req.get('authorization');//recupero il codice di autorizzazione dall'header
        let verifiedKey = 1;
        //0 = no key, 1 = wrong key, 2 = correct key

        if (inputKey != undefined && inputKey != "") {
            for (let i = 0; ((i < authorizedKey.length)); i++) {
                if (authorizedKey[i].securedKey == inputKey) {
                    verifiedKey = 2;
                    break;
                }
            }
        }
        else {
            verifiedKey = 0;
        }
        switch (verifiedKey) {
            case (0):
                console.log('Auth key not found');
                res.status(401).send('Auth key not found');
                break;
            case (1):
                console.log('Wrong auth key');
                res.status(401).send('Wrong auth key');
                break;
            case (2):
                next();
                break;
        }
    }
    static async getCFStudenteByUsername(username) {
        let dbQuery = new Promise(
            (resolve, reject) => {
                dbConnection.connect(config, function (err) {
                    let query = 'SELECT CFPersona FROM Persona WHERE Username = @username';
                    let preparedStatement = new dbConnection.PreparedStatement();
                    preparedStatement.input('username', dbConnection.VarChar(5));
                    preparedStatement.prepare(query,
                        err => {
                            if (err)
                                console.log(err);

                            preparedStatement.execute({ 'username': username },
                                (err, result) => {

                                    preparedStatement.unprepare(
                                        err => reject(err)
                                    )
                                    console.log(result.recordset.length);
                                    if (result.recordset.length == 1)
                                        resolve(result.recordset[0].CFPersona);
                                    else {
                                        let err = new Error("No CF found with the Username inserted");
                                        reject(err);
                                    }

                                })
                        })
                });
            }).catch((err) => { return undefined })
        let queryResult = await dbQuery;
        return queryResult;
    }
    static async getCFStudenteByUsernameArray(usernameArray) {
        let dbQuery = new Promise(
            (resolve, reject) => {
                dbConnection.connect(config, async function (err) {
                    let query = 'SELECT CFPersona FROM Persona WHERE Username = @username';
                    let preparedStatement = new dbConnection.PreparedStatement();
                    preparedStatement.input('username', dbConnection.VarChar(5));
                    await preparedStatement.prepare(query).catch((error) => reject(error));
                    let cfStudenti = [];
                    for (let i = 0; i < usernameArray.length; i++) {
                        let result = await preparedStatement.execute({'username': usernameArray[i] }).catch((error) => reject(error));
                        if(result)
                            cfStudenti.push(result.recordset[0].CFPersona);
                    }
                    await preparedStatement.unprepare().catch((error) => reject(error));
                    resolve(cfStudenti);
                });
            }).catch((err) => { return undefined })
        let queryResult = await dbQuery;
        return queryResult;
    }
}
module.exports = RECommonFunctions;