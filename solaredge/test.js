const axios = require('axios')
require('dotenv').config({path: './sEd.env'})

const API_ACCOUNT_TOKEN = process.env.SOLAREDGE_API_KEY
siteId = '1951350'
startDate = '2021-12-21'
endDate = '2022-12-21'

const getEndDate = (startDate) => {
    const date1 = new Date(startDate)
    const date2 = new Date(endDate)

    console.log(date1.getDate())
}

// getEndDate(startDate)

const requestURL = `https://monitoringapi.solaredge.com/site/${siteId}/energy?timeUnit=DAY&endDate=${endDate}&startDate=${startDate}&api_key=${API_ACCOUNT_TOKEN}`


// get a site energy
axios.get(requestURL)
    .then(res => console.log(res.data.energy.values))
    .catch(err => console.log(err))



// get all sites
// axios.get(`https://monitoringapi.solaredge.com/sites/list?size=20&&sortProperty=name&sortOrder=ASC&api_key=${API_ACCOUNT_TOKEN}`)
//     .then(res => console.log(res.data.sites))
//     .catch(err => console.log(err))








