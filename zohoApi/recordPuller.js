require("dotenv").config({ path: "main.env" })
const axios = require("axios")
const fs = require("fs")
const path = require("path")

const ABSOLUTE_FIRST_MONITORING_DATE = '2017-01-01'

// this requires creating the grant token first and updating env variable https://api-console.zoho.com/
const getAccessAndRefresh = async () => {
    // console.log(process.env.ZOHO_CLIENT_ID)
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
        if(response?.data) {
            const currentDir = path.dirname(__filename)
            const dataDir = path.join(currentDir, "data")
            if(!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir)
            }
            const filepath = path.join(dataDir, "zohoToken.json")
            fs.writeFileSync(filepath, JSON.stringify(response.data))
        } else {
            throw new Error("Unable to generate zoho access token")
        }
    } catch (error) {
        // console.log("error authorizing zoho")
        console.log(error.message)
    }

}

const getRefresh = async () => {
    try {
        const currentDir = path.dirname(__filename)
        const dataDir = path.join(currentDir, "data")
        if(!fs.existsSync(dataDir)) {
            throw new Error("no existing tokens to complete refresh")
        }
        const tokenFile = path.join(dataDir, "zohoToken.json")
        if(!fs.existsSync(tokenFile)) {
            throw new Error("no existing tokens to complete refresh")
        }
        const ZOHO_REFRESH_TOKEN = JSON.parse(fs.readFileSync(tokenFile))["refresh_token"]

        const refresh_url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${ZOHO_REFRESH_TOKEN}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`
        const response = await axios({
            method: "post",
            url: refresh_url,
        })

        // we can assume dataDir exists at this point other wise error thrown earlier
        fs.writeFileSync(tokenFile, JSON.stringify(response?.data))
        return true
    } catch (error) {
        console.log("error refreshing zoho")
        if (axios.isAxiosError(error)) {
            console.error('Axios error status:', error.response.status)
            console.error('Axios error:', error.message)
            console.error('Axios error data:', error.response.data)
        } else {
            console.log(error.message)
        }
        return false
    }
}

// to make this more general just accept single parameter as the select statement
const getZohoData = async (query) => {
    try {
        const currentDir = path.dirname(__filename)
        const dataDir = path.join(currentDir, "data")
        if(!fs.existsSync(dataDir)) {
            throw new Error("no existing tokens to complete refresh")
        }
        const tokenFile = path.join(dataDir, "zohoToken.json")
        if(!fs.existsSync(tokenFile)) {
            throw new Error("no existing tokens to complete refresh")
        }
        const ZOHO_ACCESS_TOKEN = JSON.parse(fs.readFileSync(tokenFile))["access_token"]
        const api_domain = "https://www.zohoapis.com"
        const sql_request_url = `${api_domain}/crm/v6/coql`
        const header = { "Authorization": `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}` }
        
        const select_statement = {
            "select_query": query
        }

        const res = await axios({
            method: "post",
            url: sql_request_url,
            data: select_statement,
            headers: header,
        })
        // two data, one because axios one because format of zoho return is {data: [], info: {}}
        return res.data.data

    } catch (error) {
        console.log("error getting zoho records")
        if (axios.isAxiosError(error)) {
            console.error('Axios error status:', error.response.status)
            console.error('Axios error:', error.message)
            console.error('Axios error data:', error.response.data)
        } else {
            console.log(error.message)
        }

        return null
    }
}

const getZohoDataInTimeFrame = async (startDate, endDate) => {
    try {
        const query = `select id, Deal_Name, PTO_Date, Inverter_Manufacturer, Enphase_Monitoring, SolarEdge_Monitoring, Sunpower_Legacy_ID, Estimated_output_year_1, Year_1_Production, Year_2_Production, Year_3, Year_4, Year_5 from Deals where ((((PTO_Date is not null) and (PTO_Date between '${startDate}' and '${endDate}')) and (Project_Type not in ('Residential Storage', 'Generator Only', 'Commercial Storage', 'Off-Grid Service', 'Service Only'))) and (((Sunpower_Legacy_ID is not null) or (SolarEdge_Monitoring is not null)) or Enphase_Monitoring is not null)) order by Deal_Name limit 0, 2000`
        const data = await getZohoData(query)
        if(!data) {
            throw new Error("Problem retrieving zoho records...")
        }
        return data
    } catch (error) {
        console.log("error getting zoho records")
        if (axios.isAxiosError(error)) {
            console.error('Axios error status:', error.response.status)
            console.error('Axios error:', error.message)
            console.error('Axios error data:', error.response.data)
        }
        return null
    }
}

const getZohoDataMiles = async (startDate, endDate) => {
    try {
        const query = `select id, Deal_Name, PTO_Date, Inverter_Manufacturer, Enphase_Monitoring, SolarEdge_Monitoring, Sunpower_Legacy_ID, Estimated_output_year_1, Year_1_Production, Year_2_Production, Year_3, Year_4, Year_5 from Deals where Deal_Name="Miles Young"`
        const data = await getZohoData(query)
        return data.data
    } catch (error) {
        console.log("Error in get miles data: ", error.message)
        return null
    }
}

// used in update record (number of records may be greater than 100 which is limit)
const splitArrayIfNeeded = (arr, maxLength = 100) => {
    if (arr.length <= maxLength) {
        return [arr];
    }

    const segments = [];
    for (let i = 0; i < arr.length; i += maxLength) {
        segments.push(arr.slice(i, i + maxLength));
    }

    return segments;
}

//the updateKeyValues must have the API names correct for keys, id controls which record is updated
// updateKeyValueArray: [{id: '6298063000000466874',Number_Update: 25}]
const updateRecord = async (updateKeyValueArray) => {
    try {
        const currentDir = path.dirname(__filename)
        const dataDir = path.join(currentDir, "data")
        if (!fs.existsSync(dataDir)) {
            throw new Error("no existing tokens")
        }
        const tokenFile = path.join(dataDir, "zohoToken.json")
        const ZOHO_ACCESS_TOKEN = JSON.parse(fs.readFileSync(tokenFile))["access_token"]

        // Zoho update API limit to 100
        if (updateKeyValueArray.length > 100) {
            const segmentsOfArray = splitArrayIfNeeded(updateKeyValueArray)
            for(let segment of segmentsOfArray) {
                const updateDataSegment = {
                    data: segment
                }
                const res = await axios.put("https://www.zohoapis.com/crm/v5/Deals", updateDataSegment, {
                    headers: {
                        Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`
                    }
                })
            }
        } else {
            const updateData = {
                data: updateKeyValueArray
            }
            const res = await axios.put("https://www.zohoapis.com/crm/v5/Leads", updateData, {
                headers: {
                    Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`
                }
            })
        }
    } catch (e) {
        console.log("there was an error updating zoho records")
        if (e.isAxiosError) {
            console.log(e.request.data)
        } else {
            console.log(e.message)
        }
    }
}

// return date obj based on execution date (scheduled)
const targetMonth = () => {
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth - 1)
    // const isoString = lastDayOfPreviousMonth.toISOString();
    // const dateString = isoString.split('T')[0];
    return lastDayOfPreviousMonth
}

// returns the PREVIOUS months sites with pto in that month (or null)
const getPtoMonthData = async () => {
    const targetDate = targetMonth()
    const targetDateIsoString = targetDate.toISOString()
    const targetDateString = targetDateIsoString.split('T')[0]

    let result;
    let refresh;
    try {
        result = await getZohoDataInTimeFrame(ABSOLUTE_FIRST_MONITORING_DATE, targetDateString)
        if(result === null) {
            refresh = await getRefresh()
            if(refresh) {
                result = await getZohoDataInTimeFrame(ABSOLUTE_FIRST_MONITORING_DATE, targetDateString)
            } else {
                throw new Error("Unable to refresh Zoho access. Reinitialize Zoho connection...")
            }
        }
        
        const resultFilterForPtoMonth = result.filter(site => {
            const ptoDate = new Date(site["PTO_Date"])
            return ptoDate.getMonth() === targetDate.getMonth()
        })
        return resultFilterForPtoMonth
    } catch (error) {
        console.log("Error in getPtoMonthData", error.message)
        return null
    }
    
}



module.exports = { getAccessAndRefresh, getRefresh, getZohoData, getZohoDataInTimeFrame, getZohoDataMiles, updateRecord, getPtoMonthData }