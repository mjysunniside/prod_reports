require('dotenv').config({path:"./main.env"})
const csv = require('csv-parser')
const fs = require('fs')
// const {getYearData} = require('./utils/report')

let results = []

fs.createReadStream('./data/ProductionReportListYear3.csv')
    .pipe(csv())
    .on('data', data => results.push(data))
    .on('end', () => {
        for(let element of results) {
            element['Record Id'] = 'weird'
        }
        console.log(results)
    })
