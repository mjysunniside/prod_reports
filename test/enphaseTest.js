const {productionTest} = require("./productionTest")

const testVerificationData = [
    {
        id: "2515235000016331015",
        name: "Tim Ogburn",
        monitoring: "1762686",
        pto: "2020-02-04",
        startingProdDate:"2020-03-01",
        production: [4581, 4875, 4280, 1217],
        monitoringType: "enphase"
    },
    {
        id: "2515235000037951034",
        name: "Tim Barribeau",
        monitoring: "2282000",
        pto: "2021-08-06",
        startingProdDate:"2021-09-01",
        production: [6872, 6381],
        monitoringType: "enphase"
    },
    {
        id: "2515235000035491037",
        name: "Kim Rafter",
        monitoring: "2193681",
        pto: "2021-04-21",
        startingProdDate:"2021-05-01",
        production: [13919, 12360, 11899],
        monitoringType: "enphase"
    },
]

const enphaseTest = async () => {
    const enphaseResult = await productionTest(testVerificationData)
    if(!enphaseResult) {
        return false
    }
    return true
}

enphaseTest()
module.exports = {enphaseTest}