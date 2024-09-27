const { getAccessAndRefresh, getRefresh,updateRecord, getPtoMonthData, firstDateOfMonth, getZohoDataInTimeFrame, targetMonth } = require("../zohoApi/recordPuller")
const { performance } = require('perf_hooks');
const {getYearData} = require('../utils/report')
const {fetchSunpower} = require('../sunpower/sunpowerMain')
const {fetchSolarEdge} = require('../solaredge/app');
const { fetchEnphase } = require("../enphase/app");


const main = async () => {
    //weird enphase
    const ogburn = "1762686"
    // another enphase
    const barou = "2282000"
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
    // off by a bit
    const hanks = "A_297754"
    //
    const rist = "A_206356"

    
    const res = await fetchSunpower(rist, "2021-06-01","2022-06-01" )
    console.log(res)
    let sum = 0;
    for(let item of res) {
        console.log(item)
        sum+=item.value
    }
    console.log(sum)
}

main()