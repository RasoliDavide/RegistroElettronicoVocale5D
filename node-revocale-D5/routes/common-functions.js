var authorizedKey = 
[
    {
            'cfProf' : "dsa",
            'securedKey' : "all"
    }
];
class RECommonFunctions
{
    static async checkAuthorizationM(req, res, next)
    {
        let inputKey = req.get('authorization');//recupero il codice di autorizzazione dall'header
        let verifiedKey = 1;
        //0 = no key, 1 = wrong key, 2 = correct key

        if(inputKey != undefined && inputKey != "")
        {
            for(let i = 0; ((i < authorizedKey.length)); i++)
            {
                if(authorizedKey[i].securedKey == inputKey)
                {
                    verifiedKey = 2;
                    break;
                }
            }
        }
        else
        {
            verifiedKey = 0;
        }
        switch(verifiedKey)
        {
            case(0):
                console.log('Auth key not found');
                res.status(401).send('Auth key not found');
                break;
            case(1):
                console.log('Wrong auth key');
                res.status(401).send('Wrong auth key');
                break;
            case(2):
                next();
                break;
        }
    }
}
module.exports = RECommonFunctions;