const { fetchSolarEdge } = require('../solaredge/app')
const { fetchEnphase } = require('../enphase/app')
// const { fetchSunpower } = require('../sunpower/app')
const { fetchSunpower } = require('../sunpower/sunpowerMain')

//return { startDate, endDate, finalSum, siteId, clientName, returnStatus: 'Success' } where (finalSum: {sum:num, nullAndUndefinedAndZeroCount: num} or null) and returnStatus is success/Error
// id like to rename to productionReport
const getYearData = async (siteId, productionStartDate, year, monitoring_company, clientName) => {
    console.log(`in the production report function site id is: ${siteId}`)
    try {
        const [startDate, endDate] = getProductionYear(productionStartDate, year)
        const data = await fetchData(siteId, startDate, endDate, monitoring_company)
        let finalSum;
        if (data==null || !data) {
            finalSum = null
        } else {
            // data is expected to be array of objects where object has {value: kwh}
            // in the future make a helper function for data injestion?
            // console.log(data)
            finalSum = data.reduce(
                (accumulator, currentValue) => {
                    if (currentValue.value == null || currentValue.value === undefined || currentValue.value === 0) {
                        accumulator.nullAndUndefinedAndZeroCount += 1
                    } else {
                        accumulator.sum += (currentValue.value)
                    }
                    return accumulator
                },
                { sum: 0, nullAndUndefinedAndZeroCount: 0 },
            );
        }
        return { startDate, endDate, finalSum, siteId, clientName, returnStatus: 'success' }
    } catch (error) {
        console.log(error)
        const ptoDateObject = new Date(productionStartDate)
        let badStartDate = new Date(productionStartDate)
        let badEndDate = new Date(productionStartDate)
        badStartDate.setFullYear(ptoDateObject.getFullYear() + (year - 1))
        badEndDate.setFullYear(ptoDateObject.getFullYear() + year)
        return { startDate: badStartDate.toISOString().split('T')[0], endDate: badEndDate.toISOString().split('T')[0], finalSum: null, siteId, clientName, returnStatus: 'error' }
    }
}

const fetchData = async (siteId, startDate, endDate, monitoring_company) => {
    let data;
    try {
        if (monitoring_company === "solaredge") {
            data = await fetchSolarEdge(siteId, startDate, endDate)
        } else if (monitoring_company === "enphase") {
            data = await fetchEnphase(siteId, startDate, endDate)
        } else if (monitoring_company === "sunpower") {
            data = await fetchSunpower(siteId, startDate, endDate)
        }
        // i removed await data
        return data    
    } catch (error) {
        return null
    }
    
}

const getProductionYear = (ptoDate, year) => {
    const ptoDateObject = new Date(ptoDate)
    const currentDate = new Date()
    let startDate = new Date(ptoDate)
    let endDate = new Date(ptoDate)

    startDate.setFullYear(ptoDateObject.getFullYear() + (year - 1))
    endDate.setFullYear(ptoDateObject.getFullYear() + year)

    if (startDate > currentDate || endDate > currentDate) {
        throw new Error(`The requested production year is out of bounds\t startDate: ${startDate} -- endDate: ${endDate}`)
    }

    return [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
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


module.exports = { getYearData, fetchData, getProductionYear, getAYearFromDate }