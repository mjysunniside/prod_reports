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
    let type;
    let siteId;
    let resolverReturner = {};
    if (manufacturer !== '' && manufacturer !== '.') {
        switch (manufacturer) {
            case "solaredge":
                type = "solaredge"
                siteId = resolveSolarEdge(solarEdge)
                if (siteId == null) {
                    resolverReturner = null
                } else {
                    resolverReturner.siteId = siteId
                    resolverReturner.type = type
                }
                break;
            case "enphase":
                type = "enphase"
                siteId = resolveEnphase(enphase)
                if (siteId == null) {
                    resolverReturner = null
                } else {
                    resolverReturner.siteId = siteId
                    resolverReturner.type = type
                }
                break;
            case "sunpower":
                type = "sunpower"
                siteId = resolveSunpower(sunpower)
                if (siteId == null) {
                    resolverReturner = null
                } else {
                    resolverReturner.siteId = siteId
                    resolverReturner.type = type
                }
                break;
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
    if(resolverReturner!==null) {
        if(resolverReturner.siteId==null || resolverReturner.type==null) {
            resolverReturner = null
        }
    }
    return resolverReturner
}

const resolveSolarEdge = (value) => {
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

// adds a years array property to client for each pto year to fetch and its corresponding property Year_${year}_Actual_Production
const resolveNeededProductionReportYears = (client) => {
    let years = []
    const {Year_1_Production, Year_2_Production, Year_3, Year_4, Year_5} = client
    const {PTO_Date} = client
    const currentDate = new Date()
    const ptoDate = new Date(PTO_Date)
    const clientNeedsYears = (client.siteId!=null && client.type!=null)

    let yearSelector;
    let endDate;
    for(let i=1 ; i <=5 ; i++ ) {
        client[`Year_${i}_Actual_Production`] = null
        if(clientNeedsYears) {
            endDate = new Date(ptoDate)
            endDate.setFullYear(ptoDate.getFullYear()+i)
            if(endDate>currentDate) {
                break;
            }
            if(i===1 || i===2) {
                yearSelector = `Year_${i}_Production`
            } else {
                yearSelector = `Year_${i}`
            }
    
            if(client[yearSelector] == null || client[yearSelector] == 0) {
                years.push(i)
            }
        }
    }
    client.yearsToFill = years
}

// adds siteId, type, years (actual years to fetch), Year_i_Actual_Production
const parseRawZohoSite = (client) => {
    const returnedTypeAndId = resolveBrandAndId({
        manufacturer: client['Inverter_Manufacturer']===null ? null : client['Inverter_Manufacturer'].toLowerCase(),
        enphase: client['Enphase_Monitoring'],
        solarEdge: client['SolarEdge_Monitoring'],
        sunpower: client['Sunpower_Legacy_ID']
    })
    if (returnedTypeAndId === null) {
        client.siteId = null
        client.type = null
    } else {
        client.siteId = returnedTypeAndId.siteId
        client.type = returnedTypeAndId.type
    }
    resolveNeededProductionReportYears(client)
}


module.exports = {parseRawZohoSite, resolveBrandAndId, resolvePtoDate, resolveProductionValue}