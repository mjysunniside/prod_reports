const {getAccessAndRefresh, getRefresh, getZohoDataInTimeFrame, getZohoData, getZohoDataMiles} = require("./recordPuller")


const start = "2018-01-01"
const end = "2021-12-31"


// const callRecords = async () => {
//     const res = await getZohoDataInTimeFrame(start, end)
//     console.log("Response.......................")
//     console.log(res)
//     // console.log(res.response)
//     // console.log("Data.......................")
//     // console.log(res.data)
// }

// const callRefresh = async () => {
//     const res = getRefresh()
// }



const main = async () => {
    try {
        const q = `select id, Deal_Name, PTO_Date, Inverter_Manufacturer, Enphase_Monitoring, SolarEdge_Monitoring, Sunpower_Legacy_ID, Estimated_output_year_1, Year_1_Production, Year_2_Production, Year_3, Year_4, Year_5 from Deals where ((PTO_Date between '${start}' and '${end}') and Inverter_Manufacturer='SunPower') order by Deal_Name limit 0, 2000`
        const res = await getZohoData(q)

    } catch (error) {
        console.log("Error in testzoho main: ", error.message)
    }
    
}



// callRecords()
// callRefresh()
// getAccessAndRefresh()
// getZohoDataMiles().then(res => console.log(res)).catch(e => console.log("there was error test"))
main()