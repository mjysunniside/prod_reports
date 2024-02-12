const axios = require('axios')
require('dotenv').config({ path: './sEd.env' })

const API_ACCOUNT_TOKEN = process.env.SOLAREDGE_API_KEY

const SITE_ID = '2004993'
const PTO_DATE = '2021-01-27'
const PRODUCTION_TOTALS = {
    1: 18215,
    2: 0,
    3: null
}
MONITORING_TYPE = "solaredge"


const getCurrentProductionYear = (ptoDate, currentProductionTotals) => {
    const nullIndexArray = []
    const zeroIndexArray = []
    for (const [key, value] of Object.entries(currentProductionTotals)) {
        if (value == null) {
            nullIndexArray.push(key)
        } else if (value === 0) {
            zeroIndexArray.push(key)
        }
    }

    if ((nullIndexArray.length === 0) && (zeroIndexArray.length === 0)) {
        console.log('all production years are filled???')
    }

    const fullYearsObject = getFullYearsSincePTO(ptoDate)
    if (fullYearsObject == null) {
        // I PROBABLY WILL HAVE TO THROW ERROR HERE
        console.log('it has not yet been a full year')
        throw new Error("I was somehow unable to find a year to check for production")
    }

    const yearNumber = Number(nullIndexArray[0])
    // have to subtract 1 because the returnYears from getFullYearsSincePTO returns a zero indexed array (year 1 is at position 0)
    yearStartAndEndArray = fullYearsObject[yearNumber - 1]

    return yearStartAndEndArray
}

const getFullYearsSincePTO = (ptoDate) => {
    const returnYears = []
    let i = 1
    let startingYear = new Date(ptoDate)
    while (i < 4) {
        const yearEndDate = getAYearFromDate(startingYear)
        if (yearEndDate == null) {
            console.log('we have a null')
            break
        }
        returnYears.push([startingYear.toISOString().split('T')[0], yearEndDate.toISOString().split('T')[0]])
        startingYear = yearEndDate

        i++
    }
    if (returnYears.length === 0) {
        return null
    }
    return returnYears
}
// if a year from "date" is in future return null
const getAYearFromDate = (date) => {
    const currentDate = new Date()
    let yearAwayDate = new Date(date)
    yearAwayDate.setFullYear(yearAwayDate.getFullYear() + 1)
    if (yearAwayDate > currentDate) {
        return null
    }
    return yearAwayDate
}

// getCurrentProductionYear(PTO_DATE, PRODUCTION_TOTALS)




//return {value:year production, nullCount: count of null dates}
const getYearData = async (siteId, ptoDate, productionYearsArray, monitoring_company) => {
    try {
        const [startDate, endDate] = getCurrentProductionYear(ptoDate, productionYearsArray)
        const data = await fetchData(siteId, startDate, endDate, monitoring_company)

        const finalSum = data.reduce(
            (accumulator, currentValue) => {
                let valueToReturn;
                if(currentValue.value==null || currentValue.value===undefined || currentValue.value===0) {
                    accumulator.nullAndUndefinedAndZeroCount += 1
                } else {
                    accumulator.sum += (currentValue.value/1000)
                }
                return accumulator
            },
            {sum:0, nullAndUndefinedAndZeroCount: 0},
        );
        console.log("the year period is: " + startDate + " to " + endDate)
        console.log("the total produced is: " + Math.round(finalSum.sum) + ".kWh")

    } catch (error) {
        console.log(error)
    }
}

const fetchData = async (siteId, startDate, endDate, monitoring_company) => {
    let data;
    if (monitoring_company === "solaredge") {
        const MAIN_SOLAREDGE_REQUEST_URL = `https://monitoringapi.solaredge.com/site/${siteId}/energy?timeUnit=DAY&endDate=${endDate}&startDate=${startDate}&api_key=${API_ACCOUNT_TOKEN}`
        await axios.get(MAIN_SOLAREDGE_REQUEST_URL)
            .then(res => data = res.data.energy.values)

    }

    return data
}


getYearData(SITE_ID, PTO_DATE, PRODUCTION_TOTALS, MONITORING_TYPE)


