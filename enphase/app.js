require("dotenv").config()
// require("dotenv").config({ path: "./enphase.env" })
const fs = require('fs')
const path = require('path');
const axios = require("axios")



MAX_RETRY_COUNT = 2


// const SITE_ID = '2109343'
// const START_DATE = '2022-01-27'
// const END_DATE = '2023-01-27'



const getAuthTokensEnphase = async () => {
  client_secret_enphase = process.env.CLIENT_SECRET_ENPHASE
  client_id_enphase = process.env.CLIENT_ID_ENPHASE
  const enphaseGetTokenUrl = `https://api.enphaseenergy.com/oauth/token?grant_type=password&username=${process.env.USERNAME_ENPHASE}&password=${process.env.PASSWORD_ENPHASE}`
  id_secret_toEncode_enphase = client_id_enphase + ":" + client_secret_enphase
  encodedIdSecret = Buffer.from(id_secret_toEncode_enphase).toString('base64')

  await axios.post(enphaseGetTokenUrl, null, {
    headers: {
      'Authorization': `Basic ${encodedIdSecret}`
    }
  })
    .then(res => {
      const currentDir = path.dirname(__filename);
      const filePath = path.join(currentDir, 'tokens.json');
      fs.writeFileSync(filePath, JSON.stringify(res.data))
    })

}

const refreshEnphase = async () => {
  const currentDir = path.dirname(__filename);
  const filePath = path.join(currentDir, 'tokens.json');
  if(!fs.existsSync(filePath)) {
    await getAuthTokensEnphase()
  }
  
  let refresh_token;
  const json = JSON.parse(fs.readFileSync(filePath))
  refresh_token = json["refresh_token"]

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
        const currentDir = path.dirname(__filename);
        const filePath = path.join(currentDir, 'tokens.json');
        fs.writeFileSync(filePath, JSON.stringify(res.data))
      } else {
        throw new Error("Error in refresh function")
      }
    })
}

const fetchEnphase = async (siteId, startDate, endDate, retryCount = 0) => {
  let access_token;
  let json;
  const currentDir = path.dirname(__filename);
  const filePath = path.join(currentDir, 'tokens.json');
  if(fs.existsSync(filePath)) {
    json = JSON.parse(fs.readFileSync(filePath))
    access_token = json["access_token"]
  } else {
    await getAuthTokensEnphase()
    json = JSON.parse(fs.readFileSync(filePath))
    access_token = json["access_token"]
  }
  // console.log(`Up top here is try ${retryCount}`)
  try {
    let data;
    const MAIN_ENPHASE_REQUEST_URL = `https://api.enphaseenergy.com/api/v4/systems/${siteId}/energy_lifetime?key=${process.env.API_KEY_ENPHASE}&start_date=${startDate}&end_date=${endDate}&production=all`
    const res = await axios.get(MAIN_ENPHASE_REQUEST_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

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
  catch (error) {
    const errorResData = error.response?.data
    if (typeof errorResData == 'undefined') {
      throw new Error(`In fetch enphase it was not authentication issues. siteID: ${siteId}`)
    }
    if (retryCount < MAX_RETRY_COUNT) {
      if (retryCount >= 1) {
        await getAuthTokensEnphase()
      } else {
        await refreshEnphase()
      }
      json = JSON.parse(fs.readFileSync(filePath))
      access_token = json['access_token']
      return await fetchEnphase(siteId, startDate, endDate, retryCount + 1)
    } else {
      throw new Error(`Reached maximum retry county in fetch enphase, site id: ${siteId}`)
    }
  }
}

const fetchAllSitesEnphase = () => {
  const access_token = tokens['access_token']
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

// const cartzdafner = {
//   clientName: "Cartzdafner",
//   siteId: '2109343',
//   ptoDate: '2021-02-02',
//   productionYears: {
//     1: 8622,
//     2: null,
//     3: null
//   },
//   monitoring: "enphase"
// }

// fetchEnphase(cartzdafner.siteId, '2022-02-02', '2023-02-02')
//   .then(res => console.log(res))
//   .catch(e => console.log(e))


module.exports = { fetchEnphase, fetchAllSitesEnphase }