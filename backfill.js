const { updateRecord, getPtoMonthData, firstDateOfMonth } = require("./zohoApi/recordPuller")
const {parseRawZohoSite} = require("./utils/zohoDataResolverUtils")
const {getYearData} = require('./utils/report');
const { writeCSV } = require("./utils/writingCSVUtil");
const { performance } = require('perf_hooks');
const fs = require('fs')

const firstDayObj = firstDateOfMonth().toISOString()
const START_DATE_DAY_MONTH = firstDayObj.split('T')[0]

const processClients = async (zohoRawData) => {
    const clientPromises = zohoRawData.map(async (client) => {
        parseRawZohoSite(client, new Date(START_DATE_DAY_MONTH))
        const yearPromises = client.yearsToFill.map(async (year) => {
            const currentYearProductionReport = await getYearData(client.siteId, client["target_pto"], year, client.type, client["Deal_Name"]) 

            if(currentYearProductionReport?.returnStatus==='success'){
                if(typeof currentYearProductionReport.finalSum?.sum === 'number') {
                    client[`Year_${year}_Actual_Production`] = Math.round(currentYearProductionReport.finalSum?.sum)
                    client[`Year_${year}_Actual_Performance`] = Math.round(currentYearProductionReport.finalSum?.sum) / client["Estimated_output_year_1"]
                    client[`Year_${year}_Null_Zero_Count`] = currentYearProductionReport?.finalSum?.nullAndUndefinedAndZeroCount
                } else {
                    // note about this line!!! null response from get year is returning 0 (this could potentially be incorrect if there was an error with api -- this means it will reinitialize sites known to be 0 with 0)
                    client[`Year_${year}_Actual_Production`] = 0
                }
            }
        })

        await Promise.all(yearPromises)
        
    })
    await Promise.all(clientPromises)
}

const processClientsSync = async (zohoCleanedData) => {
    for(let client of zohoCleanedData) {
        for(let year of client.yearsToFill) {
            const currentYearProductionReport = await getYearData(client.siteId, client["PTO_Date"], year, client.type, client["Deal_Name"])
            // update the correct year with actual production, otherwise it should already be null (or a prefilled value from zoho)
            if(currentYearProductionReport?.returnStatus==='success'){
                if(typeof currentYearProductionReport.finalSum?.sum === 'number') {
                    client[`Year_${year}_Actual_Production`] = Math.round(currentYearProductionReport.finalSum?.sum)
                    client[`Year_${year}_Actual_Performance`] = Math.round(currentYearProductionReport.finalSum?.sum) / client["Estimated_output_year_1"]
                    client[`Year_${year}_Null_Zero_Count`] = currentYearProductionReport?.finalSum?.nullAndUndefinedAndZeroCount
                    client.updated = true
                } else {
                    // note about this line!!! null response from get year is returning 0 (this could potentially be incorrect if there was an error with api -- this means it will reinitialize sites known to be 0 with 0)
                    client[`Year_${year}_Actual_Production`] = 0
                }
            }
        }
    }
}

const parseZohoSitesPromise = async (zohoRawData) => {
    const clientPromises = zohoRawData.map(async (client) => {
        parseRawZohoSite(client, new Date(START_DATE_DAY_MONTH))
        client.updated = false
    })
    await Promise.all(clientPromises)
}

const mainAsync = async () => {
    const start = performance.now()
    let zohoRawData;
    try {
        const zohoGetDataReturn = await getPtoMonthData()
        if(!zohoGetDataReturn) {
            throw new Error("Issue fetching data from zoho")
        } else {
            // zohoRawData = zohoGetDataReturn
            zohoRawData = zohoGetDataReturn.slice(35)
        }

        await parseZohoSitesPromise(zohoRawData)
        // solaredge is rate limited (I cannot enough[dont say how many] concurrent requests) :(
        await processClientsSync(zohoRawData.filter(client => client.type==="solaredge"))
        await processClients(zohoRawData.filter(client => client.type!=="solaredge"))

        const rawDataFormatted = zohoRawData.filter(client => client.yearsToFill.length>0).map(client => {
            let newFormattedClient = {id: client.id};
            for(let year of client.yearsToFill) {
                let yearSelectorString;
                let updateValue = client[`Year_${year}_Actual_Production`]
                if(year===1 || year===2) {
                    yearSelectorString = `Year_${year}_Production` 
                } else {
                    yearSelectorString = `Year_${year}`
                    // zoho keeps years 3-> as strings for some reason
                    updateValue = updateValue.toString()
                }
                newFormattedClient[yearSelectorString] = updateValue
            }
            return newFormattedClient
        })
        fs.writeFileSync('./data/formattedData.json', JSON.stringify(rawDataFormatted, null, 2));

        const checkZohoUpdateData = rawDataFormatted.every(client => client.id!=null && client.id!==0 && client.id!=='0')
        if(!checkZohoUpdateData) {
            throw new Error("zoho update data is incorrect")
        }
        // THIS LINE UPDATES ZOHO (CAREFUL!)
        await updateRecord(rawDataFormatted)

        //writing csv, the zohoRawData now has all the necessary keys for the csv standard schema
        await writeCSV(zohoRawData)

        const end = performance.now()
        console.log(`Execution time: ${(end - start).toFixed(3)} milliseconds`);
        console.log(`Number of records being updated: ${rawDataFormatted.length}`)
    } catch (error) {
        //bigger batches, please update data...
        const partialUpate = zohoRawData.filter(client => client.updated).map(client => {
            let newFormattedClient = {id: client.id};
            for(let year of client.yearsToFill) {
                let yearSelectorString;
                let updateValue = client[`Year_${year}_Actual_Production`]
                if(year===1 || year===2) {
                    yearSelectorString = `Year_${year}_Production` 
                } else {
                    yearSelectorString = `Year_${year}`
                    // zoho keeps years 3-> as strings for some reason
                    updateValue = updateValue.toString()
                }
                newFormattedClient[yearSelectorString] = updateValue
            }
            return newFormattedClient
        })
        console.log("Error in main: ", error.message)
    }
}


mainAsync()

