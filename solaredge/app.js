const axios = require('axios')
require('dotenv').config({path: './sEd.env'})

const API_ACCOUNT_TOKEN = process.env.SOLAREDGE_API_KEY

const SITE_ID = '1951350'
const PTO_DATE = '2020-12-21'
const PRODUCTION_TOTALS = {
    1: 9451,
    2: null,
    3: 0
}


const getCurrentProductionYear = (ptoDate, currentProductionTotals) => {
    const nullIndexArray = []
    const zeroIndexArray = []
    for(const [key, value] of Object.entries(currentProductionTotals)) {
        if(value == null) {
            nullIndexArray.push(key)
        } else if(value === 0) {
            zeroIndexArray.push(key)
        }
    }

    if((nullIndexArray.length===0) && (zeroIndexArray.length===0)) {
        console.log('all production years are filled???')
    }

    const fullYearsObject = getFullYearsSincePTO(ptoDate)
    if(fullYearsObject == null) {
        console.log('it has not yet been a full year')
    }

    const yearNumber = Number(nullIndexArray[0])
    // have to subtract 1 because the returnYears from getFullYearsSincePTO returns a zero indexed array (year 1 is at position 0)
    yearStartAndEndArray = fullYearsObject[yearNumber-1]

    


    return yearStartAndEndArray
}

const getFullYearsSincePTO = (ptoDate) => {
    const returnYears = []
    let i = 1
    let startingYear = new Date(ptoDate)
    while(i < 4) {
        const yearEndDate = getAYearFromDate(startingYear)
        if(yearEndDate == null) {
            console.log('we have a null')
            break
        }
        returnYears.push([startingYear.toISOString().split('T')[0], yearEndDate.toISOString().split('T')[0]])
        startingYear = yearEndDate

        i++
    }
    if(returnYears.length === 0) {
        return null
    }
    return returnYears
}
// if a year from "date" is in future return null
const getAYearFromDate = (date) => {
    const currentDate = new Date()
    let yearAwayDate = new Date(date)
    yearAwayDate.setFullYear(yearAwayDate.getFullYear() + 1)
    if(yearAwayDate > currentDate) {
        return null
    }
    return yearAwayDate
}

getCurrentProductionYear(PTO_DATE, PRODUCTION_TOTALS)




//return {value:year production, nullCount: count of null dates}
const getYearData = (siteId, ptoDate) => {
    const dateStrings = getCurrentProductionYear(ptoDate)
    const MAIN_REQUEST_URL = `https://monitoringapi.solaredge.com/site/${siteId}/energy?timeUnit=DAY&endDate=${endDate}&startDate=${startDate}&api_key=${API_ACCOUNT_TOKEN}`
}





