const { getRefresh,updateRecord, getPtoMonthData, firstDateOfMonth, getZohoDataInTimeFrame, getZohoDataMiles } = require("../zohoApi/recordPuller")

const milesYoungId = "2515235000068774051"
const client1 = {
    id: "2515235000021133020",
    name: "April Grimm",
    monitoring: "A_263679",
    pto: "2020-06-08",
    startingProdDate:"2020-07-01",
    production: [4172, 3891, 3753],
    monitoringType: "sunpower"
}


const mainTestZohoUpdate = async () => {
    try {
        await getRefresh()
        const result1 = await updateRecord([{id: milesYoungId, Year_1_Production: 100}])
        if(!result1) {
            throw new Error("First zoho update failed")
        }
        const result2 = await updateRecord([{id: milesYoungId, Year_1_Production: 200}])
        if(!result1) {
            throw new Error("Second zoho update failed")
        }

        const res = await getZohoDataMiles()
        if(res[0]?.Year_1_Production!==200) {
            throw new Error("Production updated incorrectly")
        }
        console.log("Zoho update test Success!!!")
        return true
    } catch (error) {
        console.log("Error in main zoho update test: ", error.message)
        return false
    }
}


// mainTestZohoUpdate()
// getRefresh()

module.exports = {mainTestZohoUpdate}