require('dotenv').config({ path: "./main.env" })
const csv = require('csv-parser')
const fs = require('fs')
// const { resolve } = require('path')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const {getZohoDataInTimeFrame} = require("./zohoApi/recordPuller")
const {getYearData} = require('./utils/report')

//lets do 2020 year 2 and 3
// 2021 year 1
//2019 year 1,2,3
//2018 1, 2, 3

const PRODUCTION_TARGET_YEAR = 1
const ZOHO_TIMEFRAME_START = "2022-01-01"
const ZOHO_TIMEFRAME_END = "2022-12-31"
ZOHO_PTO_YEAR = "2022"

const resolveProductionValue = (value) => {
    let numberValue;
    switch (value) {
        case '0':
            numberValue = 0
            break
        case '':
            numberValue = null
            break
        default:
            numberValue = value
    }
    return numberValue

}

const resolvePtoDate = (value) => {
    const stringSplit = value.split('/')
    if (stringSplit[0].length === 1) {
        stringSplit[0] = `0${stringSplit[0]}`
    }
    if (stringSplit[1].length === 1) {
        stringSplit[1] = `0${stringSplit[1]}`
    }

    return `${stringSplit[2]}-${stringSplit[0]}-${stringSplit[1]}`
}

// returns either {siteId, type} or null
const resolveBrandAndId = (infoObject) => {
    const { manufacturer, enphase, solarEdge, sunpower } = infoObject
    let type
    let siteId
    let resolverReturner = {}
    if (manufacturer !== '' && manufacturer !== '.') {
        switch (manufacturer) {
            case "solaredge":
                type = "solaredge"
                // console.log('we are in solaredddd')
                siteId = resolveSolarEdge(solarEdge)
                if (siteId == null) {
                    resolverReturner = null
                } else {
                    resolverReturner.siteId = siteId
                    resolverReturner.type = type
                }
                // console.log(`ok we got solared site id: ${resolverReturner.siteId}`)
                break
            case "enphase":
                type = "enphase"
                siteId = resolveEnphase(enphase)
                if (siteId == null) {
                    resolverReturner = null
                } else {
                    resolverReturner.siteId = siteId
                    resolverReturner.type = type
                }
                break
            case "sunpower":
                type = "sunpower"
                siteId = resolveSunpower(sunpower)
                if (siteId == null) {
                    resolverReturner = null
                } else {
                    resolverReturner.siteId = siteId
                    resolverReturner.type = type
                }
                break
            default:
                resolverReturner = null
        }
    } else if (solarEdge !== '' && solarEdge !== '.' && solarEdge !== '0') {
        type = "solaredge"
        siteId = resolveSolarEdge(solarEdge)
        
        if (siteId == null) {
            resolverReturner = null
        } else {
            resolverReturner.siteId = siteId
            resolverReturner.type = type
        }
    } else if (enphase !== '' && enphase !== '.' && enphase !== '0') {
        type = "enphase"
        siteId = resolveEnphase(enphase)
        if (siteId == null) {
            resolverReturner = null
        } else {
            resolverReturner.siteId = siteId
            resolverReturner.type = type
        }
    } else if (sunpower !== '' && sunpower !== '.' && sunpower !== '0') {
        // console.log(`we should be hitting this rn`)
        type = "sunpower"
        siteId = resolveSunpower(sunpower)
        if (siteId == null) {
            resolverReturner = null
        } else {
            resolverReturner.siteId = siteId
            resolverReturner.type = type
        }
    } else {
        resolverReturner = null
    }
    return resolverReturner
}

const resolveSolarEdge = (value) => {
    // console.log(value)
    try {
        if (!value.includes('http')) {
            if (value === '' || value === '.') {
                return null
            } else {
                return value
            }
        } else {
            const array = value.split('site/')
            if(!array[1]) {
                throw new Error("issue with parsing solaredge id")
            }
            
            const hashSplit = array[1].split('#')

            if(!hashSplit[1]) {
                const slashSplit = array[1].split('/')
                if(!slashSplit[1]) {
                    return array[1]
                } else {
                    return slashSplit[0]
                }
            }
            return hashSplit[0]
        }    
    } catch (error) {
        console.log("error with parsing solaredge id")
        return null
    }
    
 
}

const resolveEnphase = (value) => {
    // console.log(`Enphase value: ${value}`)
    try {
        // console.log(value)
        if (!value.includes('http')) {
            if (value === '' || value === '.') {
                return null
            } else {
                return value
            }
        } else {
            const array = value.split('systems/')

            if(!array[1]) {
                throw new Error("problem with enphase id resolver")
            }
            
            const secondSplit = array[1].split('/arrays')
            const id = secondSplit[0].endsWith('/') ? secondSplit[0].slice(0, -1) : secondSplit[0]

            return id
        }
    } catch (error) {
        console.log('unable to find enphase')
        return null
    }
    
}

const resolveSunpower = (value) => {
    // console.log(`Sunpower value: ${value}`)
    // console.log(value)
    try {
        if(value.includes('https')) {
            const firstSplit = value.split('sites/')
            if(!firstSplit[1]) {
                throw new Error("error parsing sunpower id")
            }
            const secondSplit = firstSplit[1].split('/')
            if(!secondSplit[1]) {
                return firstSplit[1]
            } else {
                return secondSplit[0]
            }
        } else if (!value.includes('A_')) {
            if (value === '' || value === '.') {
                return null
            } else {
                return value
            }
        } else {
            return value
        }
        
    } catch (error) {
        console.log("Error getting spr id")
        return null
    }
    
}

const main = async () => {
    try {
        let data;
        const zohoRes = await getZohoDataInTimeFrame(ZOHO_TIMEFRAME_START, ZOHO_TIMEFRAME_END)
        if(zohoRes?.data) {
            data = zohoRes.data
        } else {
            throw new Error("Zoho data not found")
        }

        // will this modify the original?
        for(let client of data) {
            console.log(client)
            const returnedTypeAndId = resolveBrandAndId({
                manufacturer: client['Inverter_Manufacturer']===null ? null : client['Inverter_Manufacturer'].toLowerCase(),
                enphase: client['Enphase_Monitoring'],
                solarEdge: client['SolarEdge_Monitoring'],
                sunpower: client['Sunpower_Legacy_ID']
            })
            if (returnedTypeAndId == null || (returnedTypeAndId?.siteId==null && returnedTypeAndId?.type==null)) {
                client.siteId = null
                client.type = null
                // continue
            } else {
                client.siteId = returnedTypeAndId.siteId
                client.type = returnedTypeAndId.type
            }

            if(client?.siteId==null) {
                client["Actual_Production"] = -1
                client[`Start_Date_Year_${PRODUCTION_TARGET_YEAR}`] = '01-01-2000'
                client[`End_Date_Year_${PRODUCTION_TARGET_YEAR}`] = '01-01-2000'
            } else {
                const production = await getYearData(client.siteId, client["PTO_Date"], PRODUCTION_TARGET_YEAR, client.type, client["Deal_Name"])
                if(typeof production.finalSum?.sum === 'number'){
                    client["Actual_Production"] = Math.round(production.finalSum?.sum)
                } else {
                    client["Actual_Production"] = -70
                }
                client[`Start_Date_Year_${PRODUCTION_TARGET_YEAR}`] = production.startDate
                client[`End_Date_Year_${PRODUCTION_TARGET_YEAR}`] = production.endDate
            }

        }

        const csvWriter = createCsvWriter({
            path: `./data/Year_${PRODUCTION_TARGET_YEAR}_ZohoPtoYear_${ZOHO_PTO_YEAR}.csv`,
            header: [
                { id: 'Deal_Name', title: 'Opportunity_Name' },
                { id: 'PTO_Date', title: 'PTO_Date' },
                { id: `Start_Date_Year_${PRODUCTION_TARGET_YEAR}`, title: `Production_Year_${PRODUCTION_TARGET_YEAR}_Start` },
                { id: `End_Date_Year_${PRODUCTION_TARGET_YEAR}`, title: `Production_Year_${PRODUCTION_TARGET_YEAR}_End` },
                { id: 'type', title: 'Manufacturer' },
                { id: 'siteId', title: 'Site_ID' },
                { id: 'Estimated_output_year_1', title: 'Estimated_Production' },
                { id: 'Actual_Production', title: `Actual_Production_Year_${PRODUCTION_TARGET_YEAR}` },
            ]
        });
        await csvWriter.writeRecords(data)
        console.log(`CSV file written!!!`)
            

    } catch (error) {
        console.log("there was an error in the main function!!!")
        console.log(error)
    }
}


main()
