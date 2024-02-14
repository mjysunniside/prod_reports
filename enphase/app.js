require("dotenv").config({path: "./enphase.env"})
const fs = require('fs')
const axios = require("axios")
const tokens = require('./tokenInfo.json')

const access_token = tokens['access_token']
const refresh_token = `${tokens['refresh_token']}`

client_secret_enphase = process.env.CLIENT_SECRET_ENPHASE
client_id_enphase = process.env.CLIENT_ID_ENPHASE
id_secret_toEncode_enphase = client_id_enphase + ":" + client_secret_enphase
encodedValue = Buffer.from(id_secret_toEncode_enphase).toString('base64')



const enphaseURL = `https://api.enphaseenergy.com/oauth/token?grant_type=password&username=${process.env.USERNAME_ENPHASE}&password=${process.env.PASSWORD_ENPHASE}`

// Getting oauth tokens
// axios.post(enphaseURL, null, {headers: {
//     'Authorization': `Basic ${encodedValue}`
//   }})
//     .then(res =>{ 
//       fs.writeFileSync("./tokenInfo.json", JSON.stringify(res.data))
//     })
//     .catch(error => console.log(error))

//refresh token
// axios.get(`https://api.enphaseenergy.com/oauth/token?grant_type=refresh_token&refresh_token=${refresh_token}`, {headers: {
//   'Authorization': `Basic ${encodedValue}`
// }})


// console.log(`Bearer ${tokens['ACCESS_TOKEN']}`)
// get all systems (max 100, pages in query)
// axios.get(`https://api.enphaseenergy.com/api/v4/systems/?key=${process.env.API_KEY_ENPHASE}`, {headers: {
//   'Authorization': `Bearer ${access_token}`
// }})
//   .then(res => console.log(res.data))
//   .catch(error => console.log(error))


const SITE_ID = '2109343'
const START_DATE = '2022-01-27'
const END_DATE = '2023-01-27'

//one site
axios.get(`https://api.enphaseenergy.com/api/v4/systems/${SITE_ID}/energy_lifetime?key=${process.env.API_KEY_ENPHASE}&start_date=${START_DATE}&end_date=${END_DATE}` , {headers: {
  'Authorization': `Bearer ${access_token}`
}})
  .then(res => {
    const productionArray = res.data.production
    const sum = productionArray.reduce((accumulator, currentValue) => {
      return accumulator+=(currentValue/1000)
    }, 0)
    console.log(`The sum is:\t${sum}`)

  })
  .catch(error => console.log(error))



// axios.post("https://eo1qwfm6vio6dnw.m.pipedream.net",null, {headers: {'Authorization': `Basic xecp499`}})