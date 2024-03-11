require('dotenv').config({ path: "./main.env" })
const csv = require('csv-parser')
const fs = require('fs')
// const { resolve } = require('path')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const {getYearData} = require('./utils/report')

let results = []

const PRODUCTION_TARGET_YEAR = 1

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

fs.createReadStream('./data/third_50_yr_1.csv')
    .pipe(csv())
    .on('data', data => results.push(data))
    .on('end', async () => {
        let csvClients = []
        for (let element of results) {
            let client = {}
            client.clientName = element['Opportunity Name']
            client.ptoDate = resolvePtoDate(element['PTO Date'])
            const productionYearsObject = {}
            productionYearsObject[1] = resolveProductionValue(element['Year 1 Production'])
            productionYearsObject[2] = resolveProductionValue(element['Year 2 Production'])
            productionYearsObject[3] = resolveProductionValue(element['Year 3 Production'])
            client.productionYears = productionYearsObject

            const returnedTypeAndId = resolveBrandAndId({
                manufacturer: element['Inverter Manufacturer'].toLowerCase(),
                enphase: element['Enphase Monitoring'],
                solarEdge: element['SolarEdge Monitoring'],
                sunpower: element['Sunpower Fleet MGR']
            })

            if (returnedTypeAndId == null || (returnedTypeAndId.siteId==null && returnedTypeAndId.type==null)) {
                client.siteId = null
                client.type = null
                // continue
            } else {
                client.siteId = returnedTypeAndId.siteId
                client.type = returnedTypeAndId.type
            }

            if(client.siteId==null) {
                client.production = 0
                client.startDate = '01-01-2000'
                client.endDate = '01-01-2000'
            } else {
                const production = await getYearData(client.siteId, client.ptoDate, PRODUCTION_TARGET_YEAR, client.type, client.clientName)
                if(typeof production.finalSum?.sum === 'number'){
                    client.production = Math.round(production.finalSum?.sum)
                }
                client.startDate = production.startDate
                client.endDate = production.endDate
            }

            csvClients.push(client)



        }
        // console.log(csvClients)
        const csvWriter = createCsvWriter({
            path: './data/third_50_yr_1_OUTPUT.csv',
            header: [
                { id: 'clientName', title: 'Name' },
                { id: 'ptoDate', title: 'PTO Date' },
                { id: 'siteId', title: 'Site ID' },
                { id: 'type', title: 'Manufacturer' },
                { id: 'production', title: 'Production Total' },
                { id: 'startDate', title: 'Production Year Start' },
                { id: 'endDate', title: 'Production Year End' }
            ]
        });
        csvWriter.writeRecords(csvClients)
            .then(() => {
                console.log('CSV file written successfully');
                return
            })
            .catch((err) => {
                console.error('Error writing CSV:', err);
                return
            });
    })
