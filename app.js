require('dotenv').config({path:"./main.env"})

const {getYearData} = require('./utils/report')

const cartzdafner = {
    clientName: "Cartzdafner",
    siteId: '2109343',
    ptoDate: '2021-02-02',
    productionYears: {
        1: 8622,
        2: null,
        3: null
    },
    monitoring: "enphase"
}
const kauffman = {
    clientName: "Kauffman",
    siteId: "2004993",
    ptoDate: '2021-01-27',
    productionYears: {
        1: 18215,
        2: 0,
        3: null
    },
    monitoring: "solaredge"
}



const runReport = async (person) => {
    const data = await getYearData(person.siteId, person.ptoDate, person.productionYears, person.monitoring)
    // console.log(data)
    console.log(`Client Name: ${person.clientName}`)
    console.log("the year period is: " + data.startDate + " to " + data.endDate)
    console.log("the total produced is: " + Math.round(data.finalSum.sum) + ".kWh")
}


runReport(cartzdafner)
runReport(kauffman)

