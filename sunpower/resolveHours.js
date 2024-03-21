const {fetchSunpowerHours} = require('./app')

const client1 = {
    clientName: "Sara Miles",
    siteId: "A_299486",
    startDate: "2021-03-02",
    endDate: "2021-03-09",
    productionYears: {
        1: 10085,
        2: null,
        3: null
    }
}

function getDateOneWeekAfter(existingDate) {
    // Clone the existing date to avoid modifying it directly
    const newDate = new Date(existingDate);
    
    // Add 7 days to the existing date
    newDate.setDate(newDate.getDate() + 7);
    
    return newDate;
}

function areDatesLessThan7DaysApart(date1, date2) {
    // Calculate the difference in milliseconds between the two dates
    const differenceMs = Math.abs(date1 - date2);
    
    // Calculate the number of milliseconds in 7 days
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
    // Check if the difference is less than 7 days
    return differenceMs < oneWeekMs;
}

function correctlyFormattedFetchDate(date) {
    return date.toISOString().split('T')[0]
}

let array = []


const ptoDate = new Date(client1.startDate)
const endDate = new Date(client1.endDate)
let currentStart = new Date(ptoDate)
let currentEnd = getDateOneWeekAfter(currentStart)
while(currentEnd<endDate) {
    array.push(fetchSunpowerHours(client1.siteId, correctlyFormattedFetchDate(currentStart), correctlyFormattedFetchDate(currentEnd)))
    currentStart = getDateOneWeekAfter(currentStart)
    currentEnd = getDateOneWeekAfter(currentEnd)
}
if(currentStart < endDate && areDatesLessThan7DaysApart(currentStart, endDate)) {
    array.push(fetchSunpowerHours(correctlyFormattedFetchDate(currentStart), correctlyFormattedFetchDate(endDate)))
}