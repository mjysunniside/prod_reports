const { mainTestZohoUpdate } = require("./testZohoUpdate");
const {enphaseTest} = require("./enphaseTest")
const {solaredgeTest} = require("./solaredgeTest")
const {sunpowerTest} = require("./sunpowerTest")

const mainTest = async () => {
    let testsPassed = 4
    const zohoTestResult = await mainTestZohoUpdate()
    const enphaseTestResult = await enphaseTest()
    const solaredgeTestResult = await solaredgeTest()
    const sunpowerTestResult = await sunpowerTest()

    if(!zohoTestResult) {
        console.log("TEST FAILURE: Zoho Update Test")
        testsPassed--
    } 
    if(!enphaseTestResult) {
        console.log("TEST FAILURE: Enphase Production Test")
        testsPassed--
    }
    if(!solaredgeTestResult) {
        console.log("TEST FAILURE: SolarEdge Production Test")
        testsPassed--
    }
    if(!sunpowerTestResult) {
        console.log("TEST FAILURE: SunPower Production Test")
        testsPassed--
    }

    if(!zohoTestResult || !enphaseTestResult || !solaredgeTestResult || !sunpowerTestResult) {
        console.log("TEST FAILURE: ", `test results - (${testsPassed} / 4)`)
        return false
    } else {
        console.log("TEST SUCCESS: ", `test results - (${testsPassed} / 4)`)
        return true
    }
}

mainTest()