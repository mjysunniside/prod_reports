require('dotenv').config()
// require('dotenv').config({ path: "./spr.env" })
const puppeteer = require('puppeteer')
const { setTimeout } = require("node:timers/promises")
const fs = require('fs')
const path = require('path');

const SPR_DASH = "https://monitor.sunpower.com/#/dashboard"
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
    await page.type('#username', process.env.USERNAME_SUNPOWER)
    await page.type('#password', process.env.PASSWORD_SUNPOWER)
    await page.click('[title="Sign In"]')
    await page.waitForSelector('[placeholder="Search Sites"]')
    const cookies = await page.cookies()

    const currentDir = path.dirname(__filename);
    const filePath = path.join(currentDir, 'data/cookies.json');
    fs.writeFileSync(filePath, JSON.stringify(cookies))
}

const fillMyObject = async (object, content) => {
    return new Promise((resolve, reject) => {
        if(object.hasOwnProperty('fill')) {
            reject('already has the prop')
        } else {
            resolve(object.fill = content)
        }
    })
}

//
const fetchSunpower = async (siteId, startDate, endDate) => {
    const browser = await puppeteer.launch();
    // const browser = await puppeteer.launch({ headless: false });
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
        await sprLogin(page)
        if(page.url()!==SPR_DASH) {
            throw new Error("Something went wrong logging in")
        }
    } 

    const energyUrl = `https://monitor.sunpower.com/#/sites/${siteId}/siteEnergy`
    await page.goto(energyUrl)
    await page.waitForSelector(".time-select-container")
    await setTimeout(10000);
    // The next selector is the only one that works for selecting that date range ("i want custom")
    await page.waitForSelector(".time-select-container span.mat-select-min-line.ng-tns-c3082329526-3.ng-star-inserted")
    await page.click(".time-select-container span.mat-select-min-line.ng-tns-c3082329526-3.ng-star-inserted")
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await setTimeout(10000)

    const separator = Array(156).join('=')
    page.on('response', async response => {
        if(response.request().method() !== 'POST') return
        if (response.url().includes('/graphql')) {
            const responseData = await response.json()
            // console.log(responseData.data.siteEnergy)
            await fillMyObject(responseDataObj, responseData.data.siteEnergy)
        }
    })

    //NOTE HERE I WIL HAVE TO ADJUST THE DATA CUZ SUNPOWER DONT EXPORT PARTIAL YEARS!!!!
    //MORE LIKELY I SHOULD DO IT IN CALENDAR AUTOMATION -- JUST USE DATE OBJECT AND IF DATE<15...
    await calendarAutomation(page, startDate, endDate)
    
    let i=0
    while(!responseDataObj.hasOwnProperty('fill') && i<5) {
        await setTimeout(5000)
        i++
    }
    // console.log(responseDataObj)
    await setTimeout(10000)

    
    await browser.close();

    if(responseDataObj?.fill?.items!=undefined) {

        const data = responseDataObj.fill.items.map(element => (
            {date:element.timestamp, value: element.solarProductionValues}
        ))
        
        return data

    } else {
        throw new Error("Something went wrong response data not defined")
    }
}

// const client1 = {
//     clientName: "Sara Miles",
//     siteId: "A_299486",
//     startDate: "2021-03-02",
//     endDate: "2022-03-02",
//     productionYears: {
//         1: 10085,
//         2: null,
//         3: null
//     }
// }

// fetchSunpower(client1.siteId, client1.startDate, client1.endDate).then(res => console.log(res))

module.exports = {fetchSunpower}