const fsWrite = require('fs');
const fs = require('fs').promises;
const fetch = require('node-fetch');

const FROM_DATE = 2018;
const TO_DATE = 2020;

(async () => {
  try {
    let rawData = await getRawData('./data/data.json');
    let filteredData = getDataFilteredByGraffiti(rawData);
    let coordinates = await getCoordinates(filteredData);
    //coordinates = coordinates.slice(0, 3);
    let reverseGeocodesByYear = await getReverseGeocodesByYear(coordinates);
    writeData(reverseGeocodesByYear);
  } catch (e) {
    console.log(e)
  }
})();

async function getCoordinates(data) {
  let coordinates = [];
  data.forEach(feature => {
    coordinates.push({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1], requestedDate: getDate(feature.properties.requested_datetime) })
  });
  return coordinates;
}

async function getReverseGeocode(lon, lat) {
  const response = await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`);
  const data = await response.json();
  return data;
}

async function getReverseGeocodesByYear(coordinates) {
  let reverseGeocodesByYear = [];

  // not relevant to the process, simply to get visual feedback in the console of the process
  let counter = 0;
  let total = getTotalCoordinatesByTimeframe(coordinates, FROM_DATE, TO_DATE);
  //

  for (const coordinate of coordinates) {
    let { lon, lat, requestedDate } = coordinate;
    let requestedYear = requestedDate.getFullYear();
    if (requestedYear >= FROM_DATE && requestedYear <= TO_DATE) {
      let reverseGeocode = await getReverseGeocode(lon, lat);
      let properties = reverseGeocode.features[0].properties;
      let normalizedData = getNormalizedData(properties, requestedDate);
      let existingYear = reverseGeocodesByYear.find(item => item.year === requestedYear);
      if (existingYear) {
        existingYear.collection = [...existingYear.collection, { ...normalizedData, coordinates: { lon, lat } }];
      } else {
        reverseGeocodesByYear = [...reverseGeocodesByYear, { year: requestedYear, collection: [{ ...normalizedData, coordinates: { lon, lat } }] }]
      }

      // this is not relevant to to process either, it helps seeing the process in the console
      counter++;
      console.log(`${counter} of ${total}`)
      //
    }
  }
  return reverseGeocodesByYear;
}

async function getRawData(path) {
  let data = await fs.readFile(path, 'utf8');
  return JSON.parse(data);
}

function getDataFilteredByGraffiti(data) {
  return data.features.filter(feature => feature.properties.service_code.toLowerCase() === "graffiti" || feature.properties.detail.toLowerCase().includes("graffiti") || feature.properties.title.toLowerCase().includes("graffiti") || feature.properties.description.toLowerCase().includes("graffiti") || feature.properties.service_name.toLowerCase().includes("graffiti"));
}

function getNormalizedData(properties, requestedDate) {
  let zip = properties.postcode;
  let district = properties.district;

  if (!zip) {
    switch (district) {
      case "Kreis 1":
      case "Altstadt":
        zip = "8001";
        break;
      case "Kreis 2":
        zip = "8002";
        break;
      case "Kreis 3":
        zip = "8003";
        break;
      case "Kreis 4":
      case "Aussersihl":
        zip = "8004";
        break;
      case "Kreis 5":
      case "Industriequartier":
        zip = "8005";
        break;
      case "Kreis 6":
        zip = "8006";
        break;
      case "Kreis 7":
        zip = "8007";
        break;
      case "Kreis 8":
        zip = "8008";
        break;
      case "Kreis 9":
        zip = "8047";
        break;
      case "Kreis 10":
        zip = "8037";
        break;
      case "Kreis 11":
        zip = "8046";
        break;
      case "Kreis 12":
        zip = "8050";
        break;
      default:
        zip = "NO ZIP CODE AVAILABLE";
        break;
    }
  }

  if (district && !district.includes("Kreis")) {
    switch (zip) {
      case "8001":
      case "8021":
      case "8022":
      case "8090":
      case "8091":
      case "8092":
        district = "Kreis 1";
        break;
      case "8002":
      case "8038":
      case "8041":
        district = "Kreis 2";
        break;
      case "8003":
      case "8045":
      case "8055":
      case "8063":
        district = "Kreis 3";
        break;
      case "8004":
        district = "Kreis 4";
        break;
      case "8005":
      case "8031":
        district = "Kreis 5";
        break;
      case "8006":
        district = "Kreis 6";
        break;
      case "8007":
      case "8032":
      case "8044":
      case "8053":
        district = "Kreis 7";
        break;
      case "8008":
        district = "Kreis 8";
        break;
      case "8047":
      case "8048":
        district = "Kreis 9";
        break;
      case "8037":
      case "8049":
        district = "Kreis 10";
        break;
      case "8046":
      case "8057":
      case "8052":
        district = "Kreis 11";
        break;
      case "8301":
        district = "Kreis 12";
        break;
      case "8050":
        district = properties.locality === "Oerlikon" ? "Kreis 11" : "Kreis 12";
        break;
      case "8051":
        district = properties.locality === "Hirzenbach" ? "Kreis 11" : "Kreis 12";
        break;
      default:
        district = "NO DISTRICT AVAILABLE"
    }
  }
  return { district, zip, requestedDate }
}

function getDate(dateString) {
  var year = dateString.substring(0, 4);
  var month = dateString.substring(4, 6);
  var day = dateString.substring(6, 8);
  var hour = dateString.substring(8, 10);
  var minute = dateString.substring(10, 12);
  return new Date(year, month, day, hour, minute);
}

function writeData(data) {
  try {
    fsWrite.writeFileSync('./data/processedData.json', JSON.stringify(data));
  } catch (err) {
    console.log('err writing in file: ' + err.message)
  }
}

function getTotalCoordinatesByTimeframe(coordinates, fromDate, toDate) {
  let counter = 0;
  coordinates.forEach(coordinate => {
    let requestedYear = coordinate.requestedDate.getFullYear();
    if (requestedYear >= FROM_DATE && requestedYear <= TO_DATE) {
      counter++;
    }
  })
  return counter;
}