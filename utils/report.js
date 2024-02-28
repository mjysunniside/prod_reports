const {fetchSolarEdge} = require('../solaredge/app')
const {fetchEnphase} = require('../enphase/app')

//return {value:year production, nullCount: count of null dates}
const getYearData = async (siteId, ptoDate, year, monitoring_company, clientName) => {
    console.log(`in the get year function site id is: ${siteId}`)
    try {
        const [startDate, endDate] = getProductionYear(ptoDate, year)
        const data = await fetchData(siteId, startDate, endDate, monitoring_company)
        // console.log(data)

        const finalSum = data.reduce(
            (accumulator, currentValue) => {
                let valueToReturn;
                if (currentValue.value == null || currentValue.value === undefined || currentValue.value === 0) {
                    accumulator.nullAndUndefinedAndZeroCount += 1
                } else {
                    accumulator.sum += (currentValue.value)
                }
                return accumulator
            },
            { sum: 0, nullAndUndefinedAndZeroCount: 0 },
        );
        // console.log("the year period is: " + startDate + " to " + endDate)
        // console.log("the total produced is: " + Math.round(finalSum.sum) + ".kWh")
        return await {startDate, endDate, finalSum, siteId, clientName, returnStatus:'Success'}

    } catch (error) {
        console.log(error)
        const ptoDateObject = new Date(ptoDate)
        let badStartDate = new Date(ptoDate)
        let badEndDate = new Date(ptoDate)
        badStartDate.setFullYear(ptoDateObject.getFullYear() + (year-1))
        badEndDate.setFullYear(ptoDateObject.getFullYear() + year)
        return {startDate:badStartDate.toISOString().split('T')[0], endDate:badEndDate.toISOString().split('T')[0], finalSum: {sum:-1, nullAndUndefinedAndZeroCount:0}, siteId, clientName, returnStatus:'Error'}
    }
}

const fetchData = async (siteId, startDate, endDate, monitoring_company) => {
    let data;
    if (monitoring_company === "solaredge") {
        data = await fetchSolarEdge(siteId, startDate, endDate)

    } else if (monitoring_company === "enphase") {
        data = await fetchEnphase(siteId, startDate, endDate)
    } else if (monitoring_company === "sunpower") {
        data = [{date: new Date(), value: 42}]
    }

    return await data
}

const decideWhichProductionYears = (ptoDate, productionYearsArray) => {
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
    return null
}

const getProductionYear = (ptoDate, year) => {
    const ptoDateObject = new Date(ptoDate)
    const currentDate = new Date()
    startDate = new Date(ptoDate)
    endDate = new Date(ptoDate)

    startDate.setFullYear(ptoDateObject.getFullYear() + (year-1))
    endDate.setFullYear(ptoDateObject.getFullYear() + year)

    if(startDate>currentDate || endDate>currentDate) {
        throw new Error(`The requested production year is out of bounds\t startDate: ${startDate} -- endDate: ${endDate}`)
    }

    return [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
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


module.exports = {getYearData, fetchData, getProductionYear, decideWhichProductionYears, getAYearFromDate}