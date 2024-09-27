const fs = require('fs')
const path = require('path')
const axios = require('axios')
const {fetchEnphase} = require('./app')

const siteId = '2546309'
const startDate = '2023-01-01'
const endDate = '2024-01-01'
const granularity = '15mins'

const URL_PRODUCTION = `https://api.enphaseenergy.com/api/v4/systems/${siteId}/telemetry/production_meter?key=${process.env.API_KEY_ENPHASE}&start_date=${startDate}&granularity=${granularity}`
// const URL_PRODUCTION = `https://api.enphaseenergy.com/api/v4/systems/${siteId}/telemetry/production_meter?key=${process.env.API_KEY_ENPHASE}`
const URL_CONSUMPTION = `https://api.enphaseenergy.com/api/v4/systems/${siteId}/telemetry/consumption_meter?key=${process.env.API_KEY_ENPHASE}&start_at=${startDate}&granularity=15mins`
const URL_BATTERY = `https://api.enphaseenergy.com/api/v4/systems/${siteId}/energy_lifetime?key=${process.env.API_KEY_ENPHASE}&start_date=${startDate}&end_date=${endDate}&production=all`

const fetchInterval = async () => {
    let access_token;
    let json;
    const currentDir = path.dirname(__filename)
    const filePath = path.join(currentDir, 'tokens.json')
    json = JSON.parse(fs.readFileSync(filePath))
    access_token = json["access_token"]
    try {
        // let data = await fetchEnphase(siteId, startDate, endDate);
        const res = await axios.get(URL_PRODUCTION, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        // console.log(data)
        console.log(res.data)
    } catch (error) {
        console.log("error: ", error.message)
    }
}

fetchInterval()