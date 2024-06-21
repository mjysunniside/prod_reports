const { verifyToken } = require("../sunpower/sunpowerMain")
const { getYearData } = require('../utils/report')


// make it 3 sites? sure...(increase later)
//update production with one day missing end of period
const testVerificationData = [
    {
        id: "2515235000039264015",
        name: "Stan Neugebauer",
        monitoring: "A_317390",
        pto: "2021-06-10",
        startingProdDate:"2021-07-01",
        production: [5478, 8808],
        monitoringType: "sunpower"
    },
    {
        id: "2515235000037200011",
        name: "Janet Gentry",
        monitoring: "A_264800",
        pto: "2021-08-12",
        startingProdDate:"2021-09-01",
        production: [19361, 18481],
        monitoringType: "sunpower"
    },
    // first production value from zoho
    {
        id: "2515235000021133020",
        name: "April Grimm",
        monitoring: "A_263679",
        pto: "2020-06-08",
        startingProdDate:"2020-07-01",
        production: [4172, 3891, 3753],
        monitoringType: "sunpower"
    },
]

const sunpowerTest = async () => {
    const tokenValid = await verifyToken()
    if(!tokenValid) {
        console.log("Invalid token in sunpower test")
        return false
    }
    const sunpowerResult = await productionTest(testVerificationData)
    if(!sunpowerResult) {
        return false    
    }
    return true
}

module.exports = {sunpowerTest}