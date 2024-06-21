const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require("path")
const date = new Date()
const sanitizeDate = (date) => {
    return date.toISOString().replace(/:/g, '-');
}
const sanitizedDate = sanitizeDate(date)


// the schema is an array like this [{ id: 'nameInDataObj', title: 'desiredNameInCSVoutput' }]
const writeCSV = async (data, schema=getStandardSchema(), writePath=path.join(__dirname, `../data/batchRun_${sanitizedDate}.csv`)) => {
    try {
        const csvWriter = createCsvWriter({
            path: writePath,
            header: schema
        })
        await csvWriter.writeRecords(data)
        console.log(`CSV file written!!!`)
    } catch(e) {
        console.log("Error in csv writer: ", e.message)
    }
}

const getStandardSchema = () => {
    return [
        { id: 'id', title: 'ZohoID' },
        { id: 'Deal_Name', title: 'name' },
        { id: 'PTO_Date', title: 'pto' },
        { id: 'type', title: 'Manufacturer' },
        { id: 'siteId', title: 'monitoring' },
        { id: 'Estimated_output_year_1', title: 'estimated' },
        { id: 'Year_1_Actual_Production', title: `year1` },
        { id: 'Year_2_Actual_Production', title: `year2` },
        { id: 'Year_3_Actual_Production', title: `year3` },
        { id: 'Year_4_Actual_Production', title: `year4` },
        { id: 'Year_5_Actual_Production', title: `year5` },
    ]
}

module.exports = {writeCSV, getStandardSchema}