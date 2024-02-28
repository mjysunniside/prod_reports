require('dotenv').config({ path: "./spr.env" })
const puppeteer = require('puppeteer')
const { setTimeout } = require("node:timers/promises")
const fs = require('fs')
const {getAYearFromDate} = require('../utils/report')




const SPR_DASH = "https://monitor.sunpower.com/#/dashboard"
const SPR_SITE = "https://monitor.sunpower.com/#/sites/A_291113/siteEnergy"
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

const client1 = {
    clientName: "Sara Miles",
    siteId: "A_299486",
    ptoDate: "2021-03-02",
    productionYears: {
        1: 10085,
        2: null,
        3: null
    }
}

const calendarAutomation = async (page, yearStart) => {
    await page.waitForSelector("mat-calendar")
    console.log("calendar is there")
    await page.waitForSelector(".mat-calendar-period-button")
    await page.click(".mat-calendar-period-button")
    await page.waitForSelector(".mat-calendar-table")
    console.log("found calender year table")
    const dateObj = new Date(yearStart)
    const yearAwayDateObj = getAYearFromDate(dateObj)
    if(yearAwayDateObj==null) {
        throw new Error(`the end of production year may be to late it is nullish: ${yearAwayDateObj}`)
    }
    const yearAwayDateString = yearAwayDateObj.toISOString().split('T')[0]
    const dateStartSplit = yearStart.split("-")
    const startingYear = dateStartSplit[0]
    const startingMonth = MONTH_MAP[dateStartSplit[1]]
    const startingDate = dateStartSplit[2]
    const dateEndSplit = yearAwayDateString.split("-")
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
    // console.log("in here")
    const yearSelector = `.mat-calendar-body tr td button[aria-label="${year}"] span`
    // console.log(`here is the yearsSelector: ${yearSelector}`)
    await page.waitForSelector(".mat-calendar-body")
    try {
        await page.waitForSelector(yearSelector)
        console.log('I found the selector...')
        await page.$eval(yearSelector, el => el.click())
        // await setTimeout(10000)
        // await page.click(yearSelector)
        console.log('I clicked the year')
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
    await page.type('#username', process.env.SPR_USERNAME)
    await page.type('#password', process.env.SPR_PASSWORD)
    await page.click('[title="Sign In"]')
    await page.waitForSelector('[placeholder="Search Sites"]')
    const cookies = await page.cookies()

    fs.writeFileSync('./data/cookies.json', JSON.stringify(cookies))
}



const newMain = async (client) => {
    // const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    let cookies = null
    if(fs.existsSync("./data/cookies.json")) {
        cookies = JSON.parse(fs.readFileSync("./data/cookies.json"))
        page.setCookie(...cookies)
    }

    await page.goto(SPR_DASH);
    if (page.url() !== SPR_DASH) {
        await page.waitForSelector('[title="Sign In"]');
        console.log('...logging in...')
        await sprLogin(page)
        if(page.url()===SPR_DASH) {
            console.log("we got it")
        } else {
            throw new Error("Something went wrong logging in")
        }
    } else {
        console.log("we went straight there!!!!!")
    }

    const energyUrl = `https://monitor.sunpower.com/#/sites/${client1.siteId}/siteEnergy`
    await page.goto(energyUrl)
    await page.waitForSelector(".time-select-container")
    console.log('I just waited for the time select container to check i can do further work')
    await setTimeout(10000);
    // await timeSelectContainer.waitForSelector('mat-form-field')
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

    //NOTE HERE I WIL HAVE TO ADJUST THE DATA CUZ SUNPOWER DONT EXPORT PARTIAL YEARS!!!!

    await calendarAutomation(page, client.ptoDate)


    await setTimeout(10000)

    await page.waitForSelector(".export-button")
    await page.click(".export-button")

    await setTimeout(10000)


    await browser.close();
}

newMain(client1)