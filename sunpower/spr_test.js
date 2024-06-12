// require('dotenv').config()
require('dotenv').config({ path: "./spr.env" })
const puppeteer = require('puppeteer')
const { setTimeout } = require("node:timers/promises")
const fs = require('fs')
const path = require('path');

const QUERY = `
  query siteWeather(
    $siteKey: String!
    $startDate: String!
    $weatherInterval: String!
    $energyPowerInterval: String!
    $endDate: String!
    $sitePowerAggregate: Boolean!
    $sitePowerRaw: Boolean!
    $siteEnergy: Boolean!
    $graphStartDate: String!
    $graphEndDate: String!
    $showMetrics: Boolean!
    $timezone: String!
    $includeSiteWeather: Boolean!
    $skipEnergyItems: Boolean!
  ) {
    siteEnergy(
      showMetrics: $showMetrics
      interval: $energyPowerInterval
      endDate: $graphEndDate
      startDate: $graphStartDate
      siteKey: $siteKey
      timezone: $timezone
    ) @include(if: $siteEnergy) {
      items @skip(if: $skipEnergyItems){
        timestamp
        solarProductionValues: energyProduction
        gridEnergyValues: energyGrid
        storageEnergyValues: energyStorage
        facilityConsumptionValues: energyConsumption
      }
      summary {
        solarEnergy
        consumption
        netGridImport
        storageNetCharge
      }
    }
    sitePowerRaw: sitePower(
      interval: $energyPowerInterval
      endDate: $graphEndDate
      startDate: $graphStartDate
      siteKey: $siteKey
      timezone: $timezone
    ) @include(if: $sitePowerRaw) {
      items {
        timestamp
        solarProductionValues: acPowerProduction
        gridEnergyValues: acPowerGrid
        storageEnergyValues: acPowerStorage
        facilityConsumptionValues: acPowerConsumption
      }
    }
    sitePowerAggregate: sitePower(
      interval: $energyPowerInterval
      endDate: $graphEndDate
      startDate: $graphStartDate
      siteKey: $siteKey
      timezone: $timezone
    ) @include(if: $sitePowerAggregate) {
      items {
        timestamp
        solarProductionValues: acPowerProductionAverage
        gridEnergyValues: acPowerGridAverage
        storageEnergyValues: acPowerStorageAverage
        facilityConsumptionValues: acPowerConsumptionAverage
      }
    }
    siteWeather(siteKey: $siteKey, startDate: $startDate, endDate: $endDate, interval: $weatherInterval) @include(if: $includeSiteWeather) {
      interval
      days {
        datetime
        datetimeEpoch
        tempmax
        tempmin
        temp
        feelslikemax
        feelslikemin
        dew
        humidity
        precip
        precipprob
        precipcover
        preciptype
        snow
        snowdepth
        windgust
        windspeed
        winddir
        pressure
        cloudcover
        visibility
        solarradiation
        solarenergy
        uvindex
        sunrise
        sunriseEpoch
        sunset
        sunsetEpoch
        moonphase
        conditions
        description
        icon
        stations
        source
        hours {
          datetime
          datetimeEpoch
          tempmax
          tempmin
          temp
          feelslikemax
          feelslikemin
          dew
          humidity
          precip
          precipprob
          precipcover
          preciptype
          snow
          snowdepth
          windgust
          windspeed
          winddir
          pressure
          cloudcover
          visibility
          solarradiation
          solarenergy
          uvindex
          sunrise
          sunriseEpoch
          sunset
          sunsetEpoch
          moonphase
          conditions
          description
          icon
          stations
          source
        }
      }
    }
  }
`;


const SPR_DASH = "https://monitor.sunpower.com/#/dashboard"
const GRAPHQL_URL = "https://spfm-api-graphql.prod.mysunpower.com/graphql"
const MONTH_MAP = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May", 
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
}



const calendarAutomation = async (page, startDate, endDate) => {
    await page.waitForSelector("mat-calendar")
    await page.waitForSelector(".mat-calendar-period-button")
    await page.click(".mat-calendar-period-button")
    await page.waitForSelector(".mat-calendar-table")
    
    
    const dateStartSplit = startDate.split("-")
    const startingYear = dateStartSplit[0]
    const startingMonth = MONTH_MAP[dateStartSplit[1]]
    const startingDate = dateStartSplit[2]
    const dateEndSplit = endDate.split("-")
    const endingYear = dateEndSplit[0]
    const endingMonth = MONTH_MAP[dateEndSplit[1]]
    const endingDate = dateEndSplit[2]
    
    // clicking to start of period
    await selectCalendarYear(page, startingYear)
    await selectCalendarMonth(page, startingMonth, startingYear)
    await selectCalendarDay(page, startingDate, startingMonth, startingYear)
    //reseting to year select again to start end of period
    await page.waitForSelector(".mat-calendar-period-button")
    await page.click(".mat-calendar-period-button")
    // clicking to end of period
    await selectCalendarYear(page, endingYear)
    await selectCalendarMonth(page, endingMonth, endingYear)
    await selectCalendarDay(page, endingDate, endingMonth, endingYear)
}

const selectCalendarYear = async (page, year) => {
    const yearSelector = `.mat-calendar-body tr td button[aria-label="${year}"] span`
    await page.waitForSelector(".mat-calendar-body")
    try {
        await page.waitForSelector(yearSelector)
        await page.$eval(yearSelector, el => el.click())
    } catch (error) {
        console.log(error)
        process.exit(1)
    }

}

const selectCalendarMonth = async (page, month, year) => {
    const monthSelector = `button[aria-label="${month} ${year}"] span`
    await page.waitForSelector(monthSelector)
    await page.$eval(monthSelector, el => el.click())
}

const selectCalendarDay = async (page, day, month, year) => {
    if(day.at(0) === '0') {
        day = day.substring(1)
    }
    const monthSelector = `button[aria-label="${month} ${day}, ${year}"] span`
    await page.waitForSelector(monthSelector)
    await page.$eval(monthSelector, el => el.click())
}

const sprLogin = async (page) => {
    try {
        await page.type('#username', process.env.USERNAME_SUNPOWER)
        await page.type('#password', process.env.PASSWORD_SUNPOWER)
        await page.click('[title="Sign In"]')
        // await page.waitForSelector('[placeholder="Search Sites"]')
        await setTimeout(10000);
        const cookies = await page.cookies()

        const currentDir = path.dirname(__filename);
        const dataDir = path.join(currentDir, 'data')

        if(!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir)
        }

        const filePath = path.join(dataDir, 'cookies.json');
        
        fs.writeFileSync(filePath, JSON.stringify(cookies))
        return true
    } catch (error) {
        console.log("Error logging in")
        console.log(error)
        return false
    }
    
}

const fillMyObject = async (object, content) => {
    try {
        return new Promise((resolve, reject) => {
            if(object.hasOwnProperty('fill')) {
                reject('already has the prop')
            } else {
                resolve(object.fill = content)
            }
        })
    } catch (error) {
        console.log("error giving prop in fill obj")
        console.log(error)
    }
    
}

//
const fetchSunpower = async (siteId, startDate, endDate) => {
    
    let browser
    try {
        // browser = await puppeteer.launch();
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        let responseDataObj = {};

        let cookies = null
        const currentDir = path.dirname(__filename);
        const filePath = path.join(currentDir, 'data/cookies.json');
        if(fs.existsSync(filePath)) {
            cookies = JSON.parse(fs.readFileSync(filePath))
            page.setCookie(...cookies)
        }

        await page.goto(SPR_DASH);
        if (page.url() !== SPR_DASH) {
            await page.waitForSelector('[title="Sign In"]');
            const login = await sprLogin(page)
            if(!login) {
                console.log("correctly identified error logging in...throwing error")
                throw new Error("Something went wrong logging in")
            }
            if(fs.existsSync(filePath)) {
                cookies = JSON.parse(fs.readFileSync(filePath))
                page.setCookie(...cookies)
            }
        } 

        const VARIABLES = {
            endDate: endDate,
            weatherInterval: "DAY",
            energyPowerInterval: "MONTH",
            siteKey: siteId,
            startDate: startDate,
            sitePowerAggregate: false,
            sitePowerRaw: false,
            siteEnergy: true,
            graphStartDate: `${startDate}T00:00:00`,
            graphEndDate: `${endDate}T23:59:59`,
            showMetrics: true,
            timezone: "America/Los_Angeles",
            includeSiteWeather: false,
            skipEnergyItems: false
          };

        // const responseData = await page.evaluate(async (url, token, query, variables) => {
        //     const response = await fetch(url, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': token
        //         },
        //         body: JSON.stringify({query: query,
        //             variables: variables})
        //     });
        //     return response.json();
        // }, GRAPHQL_URL, process.env.BEARER_TOKEN_GRAPH_SUNPOWER, QUERY, VARIABLES);

        const responseDataOne = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.BEARER_TOKEN_GRAPH_SUNPOWER
            },
            body: JSON.stringify({query: QUERY,
                variables: VARIABLES})
        });
        const responseData = await responseDataOne.json()
        console.log(responseData)


        await browser.close();

        if(responseData?.data?.siteEnergy?.items) {

            const data = responseData?.data?.siteEnergy?.items.map(element => (
                {date:element.timestamp, value: element.solarProductionValues}
            ))
            
            return data

        } else {
            throw new Error("Something went wrong response data not defined")
        }
    } catch(error) {
        console.log("There was an error in fetch sunpower")
        console.log(error)
        await browser.close();
        return null
    }
    
}

const client1 = {
    clientName: "Sara Miles",
    siteId: "A_299486",
    startDate: "2021-03-02",
    endDate: "2022-03-02",
    productionYears: {
        1: 10085,
        2: null,
        3: null
    }
}

const client2 = {
    clientName: "Dicicco",
    siteId: "A_230526",
    startDate: "2021-03-02",
    endDate: "2022-03-02",
    productionYears: {
        1: 10085,
        2: null,
        3: null
    }
}

const client3 = {
    clientName: "Holding",
    siteId: "A_140519",
    startDate: "2017-08-15",
    endDate: "2018-08-15",
    productionYears: {
        1: 3625,
        2: 3456,
        3: 3692,
    }
}

const clientArray = [client1, client2, client3]

// fetchSunpower(client2.siteId, client2.startDate, client2.endDate).then(res => {
//     console.log(res)
// })
// fetchSunpower(client2.siteId, client2.startDate, client2.endDate).then(res => console.log(res))
for(let client of clientArray) {
    fetchSunpower(client.siteId, client.startDate, client.endDate).then(res => console.log(client.clientName, "\n", res))
}

module.exports = {fetchSunpower}