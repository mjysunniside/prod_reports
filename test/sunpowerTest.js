const { verifyToken } = require("../sunpower/sunpowerMain")
const { getYearData } = require('../utils/report');


// make it 3 sites? sure...(increase later)
//update production with one day missing end of period
const testVerificationData = [
    {
        id: "2515235000039264015",
        name: "Stan Neugebauer",
        monitoring: "A_317390",
        pto: "2021-06-10",
        startingProdDate:"2021-07-01",
        production: [5478, 8808]
    },
    {
        id: "2515235000037200011",
        name: "Janet Gentry",
        monitoring: "A_264800",
        pto: "2021-08-12",
        startingProdDate:"2021-09-01",
        production: [19361, 18481]
    },
    // first production value from zoho
    {
        id: "2515235000021133020",
        name: "April Grimm",
        monitoring: "A_263679",
        pto: "2020-06-08",
        startingProdDate:"2020-07-01",
        production: [4172, 3891, 3753]
    },
]

const sunpowerTest = async () => {
    const validToken = await verifyToken()
    if(!validToken) {
        console.log("TEST FAILURE: invalid sunpower graphql token")
        return
    }
    const testData = await fetchBatchData()
    if(testData==null) {
        console.log("TEST FAILURE: Unable to pull SunPower data")
        return
    }
    const testDataComparison = verifyData(testData)
    if(testDataComparison) {
        console.log("FINAL TEST SUCCESS")
    } else {
        console.log("FINAL TEST FAILURE")
    }
}

const fetchBatchData = async () => {
    try {
        const returnObj = []
        for (let client of testVerificationData) {
            // const data = fetchSunpower()
            // client[]
            let testClientData = { testClientYears: [], id: client.id }

            for (const [index, yearValue] of client.production.entries()) {
                const currentYearProduction = await getYearData(client.monitoring, client.startingProdDate, index+1, "sunpower", client.name)
                // console.log(currentYearProduction)
                if (currentYearProduction?.returnStatus == 'success' && currentYearProduction?.finalSum != null) {
                    testClientData.testClientYears.push(Math.round(currentYearProduction?.finalSum?.sum))
                } else {
                    console.log(currentYearProduction)
                    throw new Error("Error pulling data")
                }
            }
            returnObj.push(testClientData)
        }
        return returnObj
    } catch (e) {
        console.log("Error in spr test fetch batch data: ", e.message)
        return null
    }
}

const verifyData = (testData) => {
    let returnValue = true;
    for (let testClient of testData) {
        const currentTestZohoId = testClient.id
        const client = testVerificationData.find(element => element.id === currentTestZohoId)
        if (client === undefined) {
            console.log("TEST FAILURE:\t Client id mismatch...")
            returnValue = false
        }
        const arraysEqual = checkArrayEquality(testClient.testClientYears, client.production)
        if(!arraysEqual) {
            console.log("TEST FAILURE:\t Production mismatch: ")
            console.log("Actual:")
            console.log(client)
            console.log("Test:")
            console.log(testClient.testClientYears)
            returnValue = false
        }
    }
    return returnValue
}

const checkArrayEquality = (arr1, arr2) => {
    if (arr1.length == arr2.length
        && arr1.every(function (u, i) {
            return u === arr2[i];
        })
    ) {
        return true
    } else {
        return false
    }
}

sunpowerTest()