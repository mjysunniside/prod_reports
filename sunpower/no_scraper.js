const fs = require('fs')
const path = require('path');
const {getCurrentGraphqlToken} = require("./sunpowerBrowserUtils.js")

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
        body: JSON.stringify({query: QUERY,
            variables: VARIABLES})
    });
    const responseData = await responseDataOne.json()
    return responseData
}

const checkIfGreaterThanHours = (date) => {
  let currentDate = new Date();
  let timeDifference = currentDate - date;
  let sixHoursInMilliseconds = 6 * 60 * 60 * 1000;
  if (timeDifference > sixHoursInMilliseconds) {
      return true
  } else {
      return false
  }
}

const tokenIsExpired = async () => {
  const res = await callApi("A_140519", "2017-08-15", "2018-08-15")
  // console.log(res?.errors[0]?.message.includes("401"))
  if(res?.errors[0]?.message.includes("401")) {
    return true
  } else {
    return false
  }
}


const verifyToken = async () => {
  if(!fs.existsSync("data") || !fs.existsSync("data/graphqlToken.json")) {
    await getCurrentGraphqlToken()
  } else if(!checkIfGreaterThanHours(fs.readFileSync("data/graphqlToken.json")["age"])) {
    await getCurrentGraphqlToken()
  } else {
    const tokenExpired = await tokenIsExpired()
    if(tokenExpired) {
      getCurrentGraphqlToken()
    } 
  }
  return true
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



// callApi(client3.siteId, client3.startDate, client3.endDate).then(res => console.log(res?.data?.siteEnergy)).catch(e => console.log(e))

// verifyToken().then(result => {if(!result) throw new Error()}).catch(e => console.log(e))

// for(let client of clientArray) {
//   result = []
//   callApi(client.siteId, client.startDate, client.endDate).then(res => {
//     console.log(res.data.siteEnergy.items)
//     result.push(res?.data?.siteEnergy?.items)
//     // console.log(result)
//   }).catch(e => console.log(e))
//     // console.log(result)
// }



module.exports = {callApiSunpower, verifyToken}

