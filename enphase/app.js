require("dotenv").config()
// require("dotenv").config({ path: "./enphase.env" })
const fs = require('fs')
const axios = require("axios")
const tokens = require('./tokens.json')


const access_token = tokens['access_token']
const refresh_token = `${tokens['refresh_token']}`





// const SITE_ID = '2109343'
// const START_DATE = '2022-01-27'
// const END_DATE = '2023-01-27'



const getAuthTokensEnphase = async () => {
  client_secret_enphase = process.env.CLIENT_SECRET_ENPHASE
  client_id_enphase = process.env.CLIENT_ID_ENPHASE
  id_secret_toEncode_enphase = client_id_enphase + ":" + client_secret_enphase
  encodedIdSecret = Buffer.from(id_secret_toEncode_enphase).toString('base64')

  await axios.post(enphaseURL, null, {
    headers: {
      'Authorization': `Basic ${encodedIdSecret}`
    }
  })
    .then(res => {
      fs.writeFileSync("./tokenInfo.json", JSON.stringify(res.data))
    })

}

const refreshEnphase = async () => {
  const REFRESH_URL_ENPHASE = `https://api.enphaseenergy.com/oauth/token?grant_type=refresh_token&refresh_token=${refresh_token}`
  client_secret_enphase = process.env.CLIENT_SECRET_ENPHASE
  client_id_enphase = process.env.CLIENT_ID_ENPHASE
  id_secret_toEncode_enphase = client_id_enphase + ":" + client_secret_enphase
  encodedIdSecret = Buffer.from(id_secret_toEncode_enphase).toString('base64')

  await axios.post(REFRESH_URL_ENPHASE, null, {
    headers: {
      'Authorization': `Basic ${encodedIdSecret}`
    }
  })
    .then(res => {
      if (res?.data?.access_token) {
        fs.writeFileSync("./tokens.json", JSON.stringify(res.data))
      } else {
        throw new Error("Error in refresh function")
      }
    })



}

const fetchEnphase = async (siteId, startDate, endDate) => {
  let data;
  const MAIN_ENPHASE_REQUEST_URL = `https://api.enphaseenergy.com/api/v4/systems/${siteId}/energy_lifetime?key=${process.env.API_KEY_ENPHASE}&start_date=${startDate}&end_date=${endDate}&production=all`
  const res = await axios.get(MAIN_ENPHASE_REQUEST_URL, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  })
    .catch(error => console.log(error))

  let dateObj = new Date(startDate)
  let production = res.data.production.map((value, index) => {
    const dateObj = new Date(startDate);
    dateObj.setDate(dateObj.getDate() + index);
    return {
      date: dateObj,
      value: (value / 1000)
    }
  })
  data = production
  // console.log(data)

  return await data
}

const fetchAllSitesEnphase = () => {
  axios.get(`https://api.enphaseenergy.com/api/v4/systems/?key=${process.env.API_KEY_ENPHASE}`, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  })
    .then(res => console.log(res.data))
    .catch(error => console.log(error))
}


// console.log(fetchEnphase(SITE_ID, START_DATE, END_DATE))
// fetchAllSitesEnphase()
// refreshEnphase()


module.exports = {fetchEnphase, fetchAllSitesEnphase}