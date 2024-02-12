require("dotenv").config({path: "./enphase.env"})
const axios = require("axios")

client_secret_enphase = process.env.CLIENT_SECRET_ENPHASE
client_id_enphase = process.env.client_id_enphase
id_secret_toEncode_enphase = client_id_enphase + ":" + client_secret_enphase
encodedValue = Buffer.from(id_secret_toEncode_enphase).toString('base64')

console.log(encodedValue)

const enphaseURL = `https://api.enphaseenergy.com/oauth/token?grant_type=password&username=${process.env.USERNAME_ENPHASE}&password=${process.env.PASSWORD_ENPHASE}`
// const enphaseURL = process.env.AUTH_URL_ENPHASE
axios.post(enphaseURL, {headers: {
    'Authorization': `Basic ${encodedValue}`
  }})
    .then(res => console.log(res.data))
    .catch(error => console.log(error))

// console.log()