const axios = require('axios')
require('dotenv').config({path: "main.env"})
// require('dotenv').config({ path: './sEd.env' })

const fetchSolarEdge = async (siteId, startDate, endDate) => {
    let data;
    try {
        const MAIN_SOLAREDGE_REQUEST_URL = `https://monitoringapi.solaredge.com/site/${siteId}/energy?timeUnit=DAY&endDate=${endDate}&startDate=${startDate}&api_key=${process.env.SOLAREDGE_API_KEY}`
        await axios.get(MAIN_SOLAREDGE_REQUEST_URL)
            .then(res => {
                data = res.data.energy.values.map(value => {
                    return { date: new Date(value.date), value: (value.value / 1000) }
                })
            })

        return data
    } catch (error) {
        console.log("fetch solaredge error: ", error.message)
        return null
    }

}

const fetchSolaredgeBulk = async (siteIds, startDate, endDate) => {
    let data;
    let siteIdsString = "";
    for(let id of siteIds) {
        siteIdsString += id + ","
    }
    try {
        const MAIN_SOLAREDGE_REQUEST_URL = `https://monitoringapi.solaredge.com/sites/${siteIdsString}/energy?timeUnit=DAY&endDate=${endDate}&startDate=${startDate}&api_key=${process.env.SOLAREDGE_API_KEY}`
        await axios.get(MAIN_SOLAREDGE_REQUEST_URL)
            .then(res => {
                data = res.data.energy.list.map(site => {
                    let returnSiteValue = {siteId: site.id}
                    if(site.values) {

                    } else {

                    }
                    return { date: new Date(value.date), value: (value.value / 1000) }
                })
            })

        return data
    } catch (error) {
        console.log("fetch solaredge error: ", error.message)
        return null
    }

}

module.exports = { fetchSolarEdge, fetchSolaredgeBulk }