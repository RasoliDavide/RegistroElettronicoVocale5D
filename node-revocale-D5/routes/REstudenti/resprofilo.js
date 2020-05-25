var dbConnection = require('mssql');
class ProfileFunctions
{
    static async getDatiStudente(cfPersona)
    {
        let dbQuery = new Promise(
            (resolve, reject) =>
            {
                dbConnection.connect(config, async function(errConn)
                {
                    let query = 'SELECT * FROM DatiStudente WHERE CFPersona = @CFPersona';
                    let preparedStatement = new dbConnection.PreparedStatement();
                    preparedStatement.input('CFPersona', dbConnection.Char(16));
                    preparedStatement.prepare(query,
                        err => 
                        {
                            if(err)
                                reject(err);
                            preparedStatement.execute({'CFPersona' : cfPersona},
                                (err, result) =>
                                {
                                    preparedStatement.unprepare(
                                        err => reject(err)
                                    )
                                    resolve(result.recordset);
                                }
                            )
                        }
                    )
                })
            }
        ).catch((err) => {console.log(err); return {success : false, message : "Database error: " + err}});;
        let result = await dbQuery;
        if(result.length == 1)
            return {success: true, datiStudente : result[0]};
        else
            return {success: false, message : "No Data Found"};
    }
}

module.exports = ProfileFunctions;