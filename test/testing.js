const { getAccessAndRefresh, getRefresh,updateRecord, getPtoMonthData, firstDateOfMonth, getZohoDataInTimeFrame, targetMonth } = require("../zohoApi/recordPuller")
const { performance } = require('perf_hooks');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const main = async () => {
    const start = performance.now()
    await delay(10000)
    console.log(targetMonth().toISOString())
    const end = performance.now()
    console.log(`Execution time: ${(end - start).toFixed(3)} milliseconds`);
}

main()