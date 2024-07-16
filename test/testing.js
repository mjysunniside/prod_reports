const { getAccessAndRefresh, getRefresh,updateRecord, getPtoMonthData, firstDateOfMonth, getZohoDataInTimeFrame, targetMonth } = require("../zohoApi/recordPuller")
const { performance } = require('perf_hooks');
const {getYearData} = require('../utils/report')
const {fetchSunpower} = require('../sunpower/sunpowerMain')
const {fetchSolarEdge} = require('../solaredge/app')


const main = async () => {
    //test case 23-24
    const biddle = "E_35319"
    // all nulls for 22-23
    const dosen = "A_133126"
    // all nulls for 22-23
    const dell = "A_171612"
    //all nulls for 23-24, 22-23, 21-22
    const sharma = "A_264862"
    // all nulls 23-24
    const warmboe = "E_19250"

    
    const res = await fetchSunpower(dell, "2022-07-01","2023-07-01" )
    console.log(res)
}

main()