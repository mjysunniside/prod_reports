require("dotenv").config({path: "main.env"})
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
  console.log(client_id_enphase)
  const enphaseGetTokenUrl = `https://api.enphaseenergy.com/oauth/token?grant_type=password&username=${process.env.USERNAME_ENPHASE}&password=${process.env.PASSWORD_ENPHASE}`
  id_secret_toEncode_enphase = client_id_enphase + ":" + client_secret_enphase
  encodedIdSecret = Buffer.from(id_secret_toEncode_enphase).toString('base64')
  try {
   axios.post(enphaseGetTokenUrl, null, {
      headers: {
        'Authorization': `Basic ${encodedIdSecret}`
      }
    })
      .then(res => {
        const currentDir = path.dirname(__filename);
        const filePath = path.join(currentDir, 'tokens.json');
        fs.writeFileSync(filePath, JSON.stringify(res.data))
      })
      return true  
  } catch (error) {
    console.log("error in get enphase access: ", error.message)
    return false
  }
}

const refreshEnphase = async () => {
  const currentDir = path.dirname(__filename);
  const filePath = path.join(currentDir, 'tokens.json');
  if (!fs.existsSync(filePath)) {
    const newTokens = await getAuthTokensEnphase()
  }
  let refresh_token;
  const json = JSON.parse(fs.readFileSync(filePath))
  refresh_token = json["refresh_token"]

  try {
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
          throw new Error("Error in enphase refresh function")
        }
      })
      return true
  } catch (e) {
    console.log("error in refresh enphase", e.message)
    return false
  }

}

const fetchEnphase = async (siteId, startDate, endDate, retryCount = 0) => {
  let access_token;
  let json;
  const currentDir = path.dirname(__filename);
  const filePath = path.join(currentDir, 'tokens.json');
  if (fs.existsSync(filePath)) {
    json = JSON.parse(fs.readFileSync(filePath))
    access_token = json["access_token"]
  } else {
    await getAuthTokensEnphase()
    json = JSON.parse(fs.readFileSync(filePath))
    access_token = json["access_token"]
  }
  // console.log(`Up top here is try ${retryCount}`)
  const MAIN_ENPHASE_REQUEST_URL = `https://api.enphaseenergy.com/api/v4/systems/${siteId}/energy_lifetime?key=${process.env.API_KEY_ENPHASE}&start_date=${startDate}&end_date=${endDate}&production=all`
  try {
    let data;
    const res = await axios.get(MAIN_ENPHASE_REQUEST_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })
    // console.log(res)

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
    if (typeof errorResData === 'undefined') {
      console.log(`In fetch enphase it was not authentication issues. siteID: ${siteId}`)
      return null
    }
    const refreshTokens = await refreshEnphase()
    if(!refreshTokens) {
      const generateNewTokens = await getAuthTokensEnphase()
      if(!generateNewTokens) {
        return null
      }
    }
    json = JSON.parse(fs.readFileSync(filePath))
    access_token = json["access_token"]
    let finalAttempt = null
    try {
      const res2 = await axios.get(MAIN_ENPHASE_REQUEST_URL, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })
      if(res2?.data?.production) {
        finalAttempt = res2.data.production.map((value, index) => {
          const dateObj = new Date(startDate);
          dateObj.setDate(dateObj.getDate() + index);
          return {
            date: dateObj,
            value: (value / 1000)
          }
        })
      }
      return finalAttempt
    } catch (error) {
      console.log("Error in enphase second fetch attempt: ", error.message)
      return null
    }
  }
}

const fetchAllSitesEnphase = () => {
  let access_token;
  let json;
  const currentDir = path.dirname(__filename);
  const filePath = path.join(currentDir, 'tokens.json');
  json = JSON.parse(fs.readFileSync(filePath))
  access_token = json["access_token"]
  console.log(access_token)
  
  axios.get(`https://api.enphaseenergy.com/api/v4/systems/?key=${process.env.API_KEY_ENPHASE}`, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  })
    .then(res => {
      console.log(res.data.length)
      console.log(res.data)
      
    })
    .catch(error => console.log(error))
}

// fetchEnphase("18224", "2023-07-01", "2024-07-01")
// fetchAllSitesEnphase()


module.exports = { fetchEnphase, fetchAllSitesEnphase }