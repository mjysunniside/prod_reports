const {fetchSolarEdge} = require('../solaredge/app')
const {fetchEnphase} = require('../enphase/app')

//return {value:year production, nullCount: count of null dates}
const getYearData = async (siteId, ptoDate, productionYearsArray, monitoring_company) => {
    try {
        const [startDate, endDate] = getCurrentProductionYear(ptoDate, productionYearsArray)
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
        return await {startDate, endDate, finalSum}

    } catch (error) {
        console.log(error)
    }
}

const fetchData = async (siteId, startDate, endDate, monitoring_company) => {
    let data;
    if (monitoring_company === "solaredge") {
        data = await fetchSolarEdge(siteId, startDate, endDate)

    } else if (monitoring_company === "enphase") {
        data = await fetchEnphase(siteId, startDate, endDate)
    }

    return await data
}

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



module.exports = {getYearData, fetchData, getCurrentProductionYear}