const { getRefresh,updateRecord, getPtoMonthData, firstDateOfMonth, getZohoDataInTimeFrame } = require("../zohoApi/recordPuller")
const {parseRawZohoSite} = require("../utils/zohoDataResolverUtils")
const { writeCSV } = require("../utils/writingCSVUtil");

const START_DATE = "2021-01-01"
const END_DATE = "2021-12-31"

const testParse = async () => {
    let zohoRawData;
    try {
        const zohoGetDataReturn = await getZohoDataInTimeFrame(START_DATE, END_DATE)
        if(!zohoGetDataReturn) {
            throw new Error("Issue fetching data from zoho")
        } else {
            zohoRawData = zohoGetDataReturn
        }

        for(let client of zohoRawData) {
            // parses messy zoho data and adds corresponding properties necessary to pull data
            parseRawZohoSite(client)
        }
        await writeCSV(zohoRawData)

    } catch (error) {
        console.log("Error in main test parse: ", error.message)
    }
}

testParse()
// getRefresh()