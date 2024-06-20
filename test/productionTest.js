const { verifyToken } = require("../sunpower/sunpowerMain")
const { getYearData } = require('../utils/report')

const productionTest = async (testData) => {
    const testDataResult = await fetchBatchData(testData)
    if(testDataResult==null) {
        console.log("TEST FAILURE: Unable to pull test data")
        return
    }
    const testDataComparison = verifyData(testDataResult, testData)
    if(testDataComparison) {
        console.log("FINAL TEST SUCCESS")
    } else {
        console.log("FINAL TEST FAILURE")
    }
}

const fetchBatchData = async (testData) => {
    try {
        const returnObj = []
        for (let client of testData) {
            // const data = fetchSunpower()
            // client[]
            let testClientData = { testClientYears: [], id: client.id }

            for (const [index, yearValue] of client.production.entries()) {
                const currentYearProduction = await getYearData(client.monitoring, client.startingProdDate, index+1, client.monitoringType, client.name)
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
        console.log("Error in enphase test fetch batch data: ", e.message)
        return null
    }
}

const verifyData = (testData, testVerificationData) => {
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

module.exports = {productionTest}