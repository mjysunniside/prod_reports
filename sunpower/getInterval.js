const fs = require('fs')
const path = require('path');
const { getCurrentGraphqlToken } = require("./sunpowerBrowserUtils.js")

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
const GRAPHQL_URL = "https://spfm-api-graphql.prod.mysunpower.com/graphql"

// Intentionally not verifying token first, must run verifyToken before using function in batch
const fetchSunpower = async (siteId, startDate, endDate) => {
    try {
        const VARIABLES = {
            endDate: endDate,
            weatherInterval: "HOUR",
            energyPowerInterval: "HOUR",
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
        const currentDir = path.dirname(__filename)
        const dataDir = path.join(currentDir, 'data')
        const filepath = path.join(dataDir, 'graphqlToken.json')
        const token = JSON.parse(fs.readFileSync(filepath))["token"]
        const responseDataOne = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                query: QUERY,
                variables: VARIABLES
            })
        });
        const responseData = await responseDataOne.json()
        if(!responseData?.data?.siteEnergy?.items) {
          return null
        }
        const formattedData = formatSunpowerApiData(responseData)
        return formattedData
    } catch (error) {
        console.log("Error in fetch SunPower: ", error.message)
        return null
    }   
}


const callApiSunpower = async (siteId, startDate, endDate) => {
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
    const token = JSON.parse(fs.readFileSync("./data/graphqlToken.json"))["token"]
    const responseDataOne = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            query: QUERY,
            variables: VARIABLES
        })
    });
    const responseData = await responseDataOne.json()
    return responseData
}

// check if token > 6 hours old (expired)
const checkIfGreaterThanHours = (date) => {
    try {
        let currentDate = new Date();
        let timeDifference = currentDate - date;
        let sixHoursInMilliseconds = 6 * 60 * 60 * 1000;
        if (timeDifference > sixHoursInMilliseconds) {
            return true
        } else {
            return false
        }    
    } catch (error) {
        console.log("Error in hour checking spr token: ", error.message)
        return true
    }   
}

// checks if existing token is no longer valid
const tokenIsExpired = async () => {
    try {
        const res = await callApi("A_140519", "2017-08-15", "2018-08-15")
        if (res?.errors[0]?.message.includes("401")) {
            return true
        } else {
            return false
        }   
    } catch (error) {
        console.log("Error in token is expired test: ", error.message)
        // cuz idk what happened stop continuing program
        return true
    }
}


const verifyToken = async () => {
    try {
        const currentDir = path.dirname(__filename)
        const dataDir = path.join(currentDir, 'data')
        const filepath = path.join(dataDir, 'graphqlToken.json')
        if (!fs.existsSync(dataDir) || !fs.existsSync(filepath)) {
            await getCurrentGraphqlToken()
        } else if (!checkIfGreaterThanHours(JSON.parse(fs.readFileSync(filepath))["age"])) {
            await getCurrentGraphqlToken()
        } else {
            let tokenExpired = await tokenIsExpired()
            if (tokenExpired) {
                await getCurrentGraphqlToken()
                //check again after getting new token
                tokenExpired = await tokenIsExpired()
                if(tokenExpired) {
                    return false
                } else {
                    return true
                }
            }
        }
        return true
    } catch (error) {
        console.log("Error in verifySunpowerToken: ", error.message)
        return false
    }

}

//formats the raw graphql api data by adding value prop expected in production report function
const formatSunpowerApiData = (data) => {
  try {
    for(let interval of data?.data?.siteEnergy?.items) {
      // "solarProductionValues" is the key for kWh interval value in spr api
      interval.value = interval.solarProductionValues
    } 
    return data?.data?.siteEnergy?.items
  } catch (error) {
    console.log("Error in format sunpower api data: ", error.message)
    return null
  }
}


const main = async () => {
    let hours = []
    const clientName = "Lois Farry"
    const id = "A_152334"
    const startDate = new Date("2023-08-14")
    let endDate = new Date("2023-08-20")
    const finalEndDate = new Date("2024-08-14")
    while(endDate < finalEndDate) {
        const res = await fetchSunpower(id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
        hours.push(...res)
        startDate
        startDate.setDate(startDate.getDate() + 7)
        endDate.setDate(endDate.getDate() + 7)
        if(endDate > finalEndDate) {
            endDate = new Date(finalEndDate)
        }
    }

    fs.writeFileSync('./data/FarryHourlyIntervalProduction.json', JSON.stringify(hours));
}

main()