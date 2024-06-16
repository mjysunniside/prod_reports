const { updateRecord, getPtoMonthData, firstDateOfMonth } = require("./zohoApi/recordPuller")
const {parseRawZohoSite} = require("./utils/zohoDataResolverUtils")
const {getYearData} = require('./utils/report');
const { writeCSV } = require("./utils/writingCSVUtil");

const firstDayObj = firstDateOfMonth()
const START_DATE_REPLACE_PTO = firstDayObj.split('T')[0]

const main = async () => {
    let zohoRawData;
    try {
        const zohoGetDataReturn = await getPtoMonthData()
        if(!zohoGetDataReturn) {
            throw new Error("Issue fetching data from zoho")
        } else {
            zohoRawData = zohoGetDataReturn
        }

        for(let client of zohoRawData) {
            // parses messy zoho data and adds corresponding properties necessary to pull data
            parseRawZohoSite(client)
            // add production for each year
            for(let year of client.years) {
                const currentYearProductionReport = await getYearData(client.siteId, START_DATE_REPLACE_PTO, year, client.type, client["Deal_Name"])
                // update the correct year with actual production, otherwise it should already be null (or a prefilled value from zoho)
                if(currentYearProductionReport?.status==='success' && typeof currentYearProductionReport.finalSum?.sum === 'number'){
                    client[`Year_${year}_Actual_Production`] = Math.round(currentYearProductionReport.finalSum?.sum)
                }
            }
        }
        // here in production we do this differently

        // update zohoRecords DO NOT UNCOMMENT!!!
        // const rawDataFormatted = zohoRawData.filter(client => client.years.length>0).map(client => {
        //     let newFormattedClient = {id: client.id};
        //     for(let year of client.years) {
        //         if(year===1 || year===2) {
        //             newFormattedClient[``]
        //         }
        //     }
        // })
        // when un comment check format first
        // console.log(rawDataFormatted)
        // await updateRecord(rawDataFormatted)


        //writing csv, the zohoRawData now has all the necessary keys for the csv standard schema
        await writeCSV(zohoRawData)

    } catch (error) {
        console.log("Error in main: ", error.message)
    }
}

main()

