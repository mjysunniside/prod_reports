require('dotenv').config({ path: "./main.env" })
// require('dotenv').config({ path: "./spr.env" })
const puppeteer = require('puppeteer')
const { setTimeout } = require("node:timers/promises")
const fs = require('fs')
const path = require('path');

const SPR_DASH = "https://monitor.sunpower.com/#/dashboard"


const sprLogin = async (page) => {
    try {
        setTimeout(10000)
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

const getCurrentGraphqlToken = async () => {
    const chuckSite = {
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
    const siteId = chuckSite.siteId
    const startDate = chuckSite.startDate
    const endDate = chuckSite.endDate
    let browser;
    try {
        // browser = await puppeteer.launch({ headless: false });
        browser = await puppeteer.launch();
        const page = await browser.newPage();
  
        let cookies = null
        const currentDir = path.dirname(__filename);
        const dataDir = path.join(currentDir, 'data')
        const filePath = path.join(currentDir, 'cookies.json');
        if(fs.existsSync(filePath)) {
            cookies = JSON.parse(fs.readFileSync(filePath))
            page.setCookie(...cookies)
        }
  
        await page.goto(SPR_DASH);
        if (page.url() !== SPR_DASH) {
            await page.waitForSelector('[title="Sign In"]');
            await sprLogin(page)
            await page.goto(SPR_DASH)
            if(page.url()!==SPR_DASH) {
                throw new Error("Something went wrong logging in")
            }
            if(fs.existsSync(filePath)) {
                cookies = JSON.parse(fs.readFileSync(filePath))
                page.setCookie(...cookies)
            }
        } 
  
        
        page.on('request', async request => {
            if(request.url().includes('/graphql')) {            
                if(request.headers()["authorization"]) {
                    const qlToken = request.headers()["authorization"].split(" ")[1]   
                    const currentDir = path.dirname(__filename);
                    const dataDir = path.join(currentDir, 'data')
    
                    if(!fs.existsSync(dataDir)) {
                        fs.mkdirSync(dataDir)
                    } 
    
                    const filePath = path.join(dataDir, 'graphqlToken.json');
                    let existingToken = null;
    
                    if (fs.existsSync(filePath)) {
                        existingToken = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    }
    
                    
                    if (existingToken["token"] !== qlToken) {
                        fs.writeFileSync(filePath, JSON.stringify({token:qlToken, age: new Date()}));
                    }
                }
            }
        });
        const energyUrl = `https://monitor.sunpower.com/#/sites/${siteId}/siteEnergy`
        await page.goto(energyUrl)
        await setTimeout(10000)
        return true
    } catch (error) {
        console.log("Error in SunPower get graphql token: ", error.message)
        return false
    } finally {
        await browser.close()
    }
  }

  module.exports = {sprLogin, getCurrentGraphqlToken}