const { getAccessAndRefresh, getRefresh,updateRecord, getPtoMonthData, firstDateOfMonth, getZohoDataInTimeFrame, targetMonth } = require("../zohoApi/recordPuller")
const { performance } = require('perf_hooks');
const {getYearData} = require('../utils/report')
const {fetchSunpower} = require('../sunpower/sunpowerMain')


const main = async () => {
    const id = "A_169680"
    const start = "2021-07-01"
    const end = "2022-07-01"
    const year = 2
    const monitoring_company = "sunpower"
    const name = "Alison Sweetser Expansion"
    const res = await fetchSunpower(id, start, end)
    console.log(res)
}

main()