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
axios.get(`https://api.enphaseenergy.com/api/v4/systems/?key=${process.env.API_KEY_ENPHASE}`, {headers: {
  'Authorization': `Bearer ${access_token}`
}})
  .then(res => console.log(res.data))
  .catch(error => console.log(error))



//one site
// axios.get(`https://api.enphaseenergy.com/api/v4/systems/2686066/summary?key=${process.env.API_KEY_ENPHASE}` , null, {headers: {
//   'Authorization': `Bearer ${tokens['ACCESS_TOKEN']}`
// }})




// axios.post("https://eo1qwfm6vio6dnw.m.pipedream.net",null, {headers: {'Authorization': `Basic xecp499`}})