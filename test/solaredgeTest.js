const {productionTest} = require("./productionTest")

const testVerificationData = [
    {
        id: "2515235000035577021",
        name: "Jessica Parker",
        monitoring: "2327076",
        pto: "2021-08-05",
        startingProdDate:"2021-09-01",
        production: [12974, 12057],
        monitoringType: "solaredge"
    },
    {
        id: "2515235000011506001",
        name: "Matt Hinkle",
        monitoring: "105871",
        pto: "2019-07-02",
        startingProdDate:"2019-08-01",
        production: [12834, 10772, 12302, 9819],
        monitoringType: "solaredge"
    },
    {
        id: "2515235000031846055",
        name: "Perry Thomas",
        monitoring: "2198868",
        pto: "2021-03-18",
        startingProdDate:"2021-04-01",
        production: [6360, 7070, 7661],
        monitoringType: "solaredge"
    },
]

const solaredgeTest = async () => {
    const solaredgeResult = await productionTest(testVerificationData)
    if(!solaredgeResult) {
        return false    
    }
    return true
}

solaredgeTest()

module.exports = {solaredgeTest}