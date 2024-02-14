const axios = require('axios')
require('dotenv').config({ path: './sEd.env' })

const API_ACCOUNT_TOKEN = process.env.SOLAREDGE_API_KEY

const SITE_ID = '2004993'
const PTO_DATE = '2021-01-27'
const PRODUCTION_TOTALS = {
    1: 18215,
    2: 0,
    3: null
}


const fetchSolarEdge = async (siteId, startDate, endDate) => {
    let data;
    const MAIN_SOLAREDGE_REQUEST_URL = `https://monitoringapi.solaredge.com/site/${siteId}/energy?timeUnit=DAY&endDate=${endDate}&startDate=${startDate}&api_key=${process.env.SOLAREDGE_API_KEY}`
    await axios.get(MAIN_SOLAREDGE_REQUEST_URL)
        .then(res => data = res.data.energy.values)
    return await data
}



module.exports = {fetchSolarEdge}












