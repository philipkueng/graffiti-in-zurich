# Graffiti in Zurich between 2018 and 2020

This is a school project for the subject "Visual Storytelling" in my degree for Interaction Design. The idea of this project is to create a visualization about the reported Graffiti in Zurich from the service "züri-wie-neu" in between the years 2018 and 2020. 

## Table of contents
1. [Data](#data)  
  1.1. [Used data](#used-data)  
  1.2. [Process data](#process-data)  
  1.3. [Methodology](#methodology)  
    1.3.1 [Filter the data](#filter-the-data)  
    1.3.2 [Get coordinates from data](#get-coordinates-from-data)  
    1.3.3 [Sort by year and reverse geocodes](#sort-by-year-and-reverse-geocodes)  
2. [Website](#website)  
  2.1 [tbd](#tbd)  

## Data 

### Used data

The data until mid Feburar 2021 will be included in the file `./graffiti-data/data/data.json`. Newer data can be requested [on the website of Stadt Zurich/züri-wie-neu](https://www.stadt-zuerich.ch/geodaten/download/Zueri_wie_neu?format=10009) via E-Mail. Download the data as `json` and replace it in the `data.json` file.

### Process data

To get the processedData, follow those steps:
- Open the terminal and navigate to `graffiti-in-zurich/graffiti-data` directory 
- Run `npm i` to install the dependencies
- Run `node index.js` to start the process
- The processed data will be found in the folder `graffiti-in-zurich/graffiti-data/data/processedData.json`

### Methodology

#### Filter the data

The data provided by züri-wie-neu contains all kind of service codes. From `Abfall/Sammelstelle` to `Strasse/Trottoir/Platz` and `Graffiti`. It seems that in the early days of this service, the service code `Graffiti` wasn't available, but often mentioned in the properties `service_notice`, `title`, `description` or `service_name`. 

Due to those circumstances the data will be filtered by the function `getDataFilteredByGraffiti(data)` before continuing. The function will filter the following properites `service_code`, `service_notice`, `title`, `description` and `service_name` by the value `graffiti` and then return the filtered data. 


#### Get coordinates from data

```json
{
  "geometry" : {
    "coordinates" : [ 8.4842263013, 47.3740377357 ]
  },
  "properties" : {
    "requested_datetime" : "20130314151615",
  }
}
```

The `json` above is a striped back example of a `features`-array entry in the `graffiti-data/data/data.json` file and shows the used properties only. In the function `getCoordinates(data)`, the coordinates of the property `geometry` and the `requestedDate` from the `properties` object will be formed into a new object and returned as following: 

```json
[
  {
    "lon": 1,
    "lat": 2,
    "requestedDate": "2020-03-21-12-03Z"
  }
]
```

To note here: The date property in the data provided by züri-wie-neu is formatted like this `2021032112030303` and will be rearranged with the function `getDate(dateString)`, which splits the string into the components `year`, `month`, `day`, `hour`, and `minute` and retuned as a `Date`-object.


#### Sort by year and reverse geocodes

Within the function `getReverseGeocodesByYear(coordinates)` happens most of the magic. The coordinates get looped and the `requestedDate` checked if it's added already. If so, with calling the function `getReverseGeocode(lon, lat)` the api(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`) of Photon will be called with the given variables. 

The api returns then the following `json`: 

The displayed properties are, again, striped back to the properties that are used. 

```json
{
  "features": [
    {
      "geometry": {},
      "properties": {
        "postcode": "8047",
        "locality": "Albisrieden",
        "district": "Kreis 9",
      }
    }
  ]
}
```

Those information will then be normalized in the function `getNormalizedData(data)`. This process is not based on a "scientific" process and might have a lot of space for improvement. Further information how the `district` and the `zip`-code is set will be found [within the function](https://github.com/philipkueng/graffiti-in-zurich/blob/37ff3b4559fbe7a7ad853ee072802644c5f07583/graffiti-data/index.js#L75). 

After the information is normalized, it will be added in an array and to it's related year.

The function then returns an array as following:

```json
[
  {
    "year": 2018,
    "collection": [
      {
        "district": "Kreis 1",
        "zip": "8001",
        "requestedDate": "2021-03-21-12-03Z"
      }
    ]
  }

]
```

Those information will then be written down in the file `graffiti-data/data/processedData.json`

## Website 

### tbd