const fsWrite = require('fs');
const fs = require('fs').promises;
const zurich_districts = ["Kreis 1", "Kreis 2", "Kreis 3", "Kreis 4", "Kreis 5", "Kreis 6", "Kreis 7", "Kreis 8", "Kreis 9", "Kreis 10", , "Kreis 11", "Kreis 12"];

(async () => {
  try {
    let report = '';
    let rawData = await getRawData('./data/processedData.json');
    let frequencyByYear = getFrequencyByYear(rawData);
    let frequencyByDistrict = getFrequencyByDistrict(rawData);
    let totalInfo = getFrequencyByYearAndDistrictWithCoordinates(rawData);
    report += getFrequencyByYearReport(frequencyByYear);
    report += "```json\n"
    report += JSON.stringify(frequencyByYear);
    report += "\n```\n"
    report += getFrequencyByDistrictReport(frequencyByDistrict);
    report += "```json\n"
    report += JSON.stringify(frequencyByDistrict);
    report += "\n```\n"
    report += "```json\n"
    report += JSON.stringify(totalInfo);
    report += "\n```\n"
    writeData(report);
  } catch (e) {
    console.log(e)
  }
})();

function getFrequencyByYear(data) {
  let frequencyByYear = [];
  data.forEach(feature => {
    if (feature) {
      frequencyByYear.push({ year: feature.year, totalReports: feature.collection.length })
    }
  })

  // sort by most to least
  return frequencyByYear.sort(function (a, b) {
    return b.totalReports - a.totalReports;
  });
}

function getFrequencyByYearReport(data) {
  let report = '## Most frequent year\n';
  data.forEach((feature, index) => {
    if (index + 1 === data.length) {
      report += `The year with the least graffitis is ${feature.year} with ${feature.totalReports}\n\n`
    } else if (index === 0) {
      report += `\nThe year with the most graffitis is ${feature.year} with ${feature.totalReports}\n`
    } else {
      report += `The year with the ${index + 1}. most graffitis is ${feature.year} with ${feature.totalReports}\n`
    }
  })
  return report;
}

function getFrequencyByDistrict(data) {
  let frequencyByDistrict = [];
  data.forEach(feature => {
    let year = feature.year;
    let existingYear = frequencyByDistrict.find(item => item.year === year);
    if (!existingYear) {
      frequencyByDistrict.push({
        year, districts: [
          { "name": "Kreis 1", totalReports: 0 },
          { "name": "Kreis 2", totalReports: 0 },
          { "name": "Kreis 3", totalReports: 0 },
          { "name": "Kreis 4", totalReports: 0 },
          { "name": "Kreis 5", totalReports: 0 },
          { "name": "Kreis 6", totalReports: 0 },
          { "name": "Kreis 7", totalReports: 0 },
          { "name": "Kreis 8", totalReports: 0 },
          { "name": "Kreis 9", totalReports: 0 },
          { "name": "Kreis 10", totalReports: 0 },
          { "name": "Kreis 11", totalReports: 0 },
          { "name": "Kreis 12", totalReports: 0 },
        ]
      })
    }
    // get year within data
    existingYear = frequencyByDistrict.find(item => item.year === year);
    // iterate through collection and add district to existing year.totalReports
    feature.collection.forEach(info => {
      let district = existingYear.districts.find(dis => dis.name === info.district);
      if (!district) {
        console.log(`There is something weird going on with ${JSON.stringify(info)}`);
      }
      district.totalReports += 1;
    })
  });

  // sort by newest to oldest
  return frequencyByDistrict.sort(function (a, b) {
    return b.year - a.year;
  });
}

function getFrequencyByDistrictReport(data) {
  let report = '## District frequency (newest to oldest) \n\n';
  data.forEach(feature => {
    report += `### District frequency in ${feature.year} (most to least)\n\n`;
    let districts = feature.districts.sort(function (a, b) {
      return b.totalReports - a.totalReports;
    });
    districts.forEach((district, index) => {
      report += `${index + 1}. ${district.name} with a total report of ${district.totalReports} cases\n`;
      if (index + 1 === districts.length) {
        report += '\n';
      }
    })
  })
  return report;
}

function getFrequencyByYearAndDistrictWithCoordinates(data) {
  let processedData = [];
  data.forEach(feature => {
    if (feature) {
      let year = { year: feature.year, totalReports: 0, districts: [] };

      zurich_districts.forEach(districtName => {
        let district = feature.collection.filter(entry => entry.district === districtName)
        let districtTotalReports = district.length;
        year.totalReports += districtTotalReports;
        let coordinates = [];
        district.map(districtInfo => {
          coordinates = [...coordinates, districtInfo.coordinates]
        })

        year.districts.push({
          name: districtName,
          totalReports: districtTotalReports,
          coordinates
        })
      })
      processedData = [...processedData, year];
    }
  })
  return processedData;
}

async function getRawData(path) {
  let data = await fs.readFile(path, 'utf8');
  return JSON.parse(data);
}

function writeData(data) {
  try {
    fsWrite.writeFileSync('./data/report.md', data);
  } catch (err) {
    console.log('err writing in file: ' + err.message)
  }
}
