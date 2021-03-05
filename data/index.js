const fsWrite = require('fs');
const fs = require('fs').promises;
const fetch = require('node-fetch');

(async () => {
  try {
    let rawData = await getRawData('./data/data.json');
    let data = filterDataByGraffiti(rawData);
    let coordinates = await getCoordinates(data);
    // coordinates = coordinates.slice(0, 5);
    let infos = await getReverseGeocodes(coordinates);

    console.log(infos);

    await writeData(infos);
  } catch (e) {
    // Deal with the fact the chain failed
  }
})();

async function getCoordinates(data) {
  let coordinates = [];
  data.forEach(feature => {
    coordinates.push({ lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] })
  });
  return coordinates;
}

async function getCoordinateInfo(lon, lat) {
  const response = await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`);
  const data = await response.json();
  return data;
}

async function getReverseGeocodes(coordinates) {
  let infos = [];
  let counter = 0;
  let total = coordinates.length;

  for (const coordinate of coordinates) {
    let { lon, lat } = coordinate;
    const info = await getCoordinateInfo(lon, lat);
    let properties = info.features[0].properties;
    infos.push(getNormalizedData(properties));
    counter++;
    console.log(`${counter} of ${total}`)
  }
  return infos;
}

async function getRawData(path) {
  let data = await fs.readFile(path, 'utf8');
  return JSON.parse(data);
}

function filterDataByGraffiti(data) {
  return data.features.filter(feature => feature.properties.service_code === "Graffiti" || feature.properties.detail.includes("Graffiti") || feature.properties.title.includes("Graffiti") || feature.properties.description.includes("Graffiti") || feature.properties.service_name.includes("Graffiti"));
}

function getNormalizedData(properties) {
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
        zip = undefined;
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
        district = properties
    }
  }
  return { district, zip }
}

function writeData(data) {
  try {
    fsWrite.writeFileSync('./data/processedData.json', JSON.stringify(data));
  } catch (err) {
    console.log('err writing in file: ' + err.message)
  }
}

