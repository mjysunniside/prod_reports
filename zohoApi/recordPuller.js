require("dotenv").config()
const axios = require("axios")

const getAccessAndRefresh = async () => {
    try {
        const auth_url = "https://accounts.zoho.com/oauth/v2/token"
        let bodyFormData = new FormData()
        bodyFormData.append("grant_type", "authorization_code")
        bodyFormData.append("client_id", process.env.ZOHO_CLIENT_ID)
        bodyFormData.append("client_secret", process.env.ZOHO_CLIENT_SECRET)
        bodyFormData.append("code", process.env.ZOHO_GRANT_TOKEN)
        const response = await axios({
            method: "post",
            url: auth_url,
            data: bodyFormData,
            headers: { "Content-Type": "multipart/form-data" },
        })
        console.log(response?.data)
    } catch (error) {
        console.log("error authorizing zoho")
        console.log(error)
    }

}

const getRefresh = async () => {
    try {
        const refresh_url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.ZOHO_REFRESH_TOKEN}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`
        const response = await axios({
            method: "post",
            url: refresh_url,
        })
        console.log(response?.data)
    } catch (error) {
        console.log("error refreshing zoho")
        console.log(error)
    }
}

const getZohoDataInTimeFrame = async (startDate, endDate) => {
    try {
        const api_domain = "https://www.zohoapis.com"
        const sql_request_url = `${api_domain}/crm/v6/coql`
        const header = { "Authorization": `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}` }
        const select_statement = {
            "select_query": `select Deal_Name, PTO_Date, Inverter_Manufacturer, Enphase_Monitoring, SolarEdge_Monitoring, Sunpower_Legacy_ID, Estimated_output_year_1, Year_1_Production, Year_2_Production, Year_3, Year_4, Year_5 from Deals where (((PTO_Date is not null) and (Year_1_Production is not null)) and (PTO_Date between '${startDate}' and '${endDate}')) order by Deal_Name limit 0, 2000`
        }
        const data = await axios({
            method: "post",
            url: sql_request_url,
            data: select_statement,
            headers: header,
        })
    
        return data.data

    } catch (error) {
        console.log("error getting zoho records")
        console.log(error)
    }
}


module.exports = {getAccessAndRefresh, getRefresh, getZohoDataInTimeFrame}