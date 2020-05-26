
class RESCommonFunctions 
{
    static dateToString(date) 
    {
        try 
        {
            let string = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
            return string;
        }
        catch (err) {
            return null;
        }
    }
    static timeToString(time) 
    {
        try
        {
            let string;
            let minuti = time.getMinutes();
            string = (time.getHours() + ":");
            if (minuti <= 9)
                string += "0" + minuti;
            else
                string += minuti;
            return string;
        }
        catch(err)
        {
            return null;
        }
    }
}
module.exports = RESCommonFunctions;