# Graffiti in Zurich between 2018 and 2020

This is a school project for the subject "Visual Storytelling" in my degree for Interaction Design. The idea of this project is to create a visualization about the reported Graffiti in Zurich from the service "züri-wie-neu" in between the years 2018 and 2020. 

# Table of content
- Data
-- Used data
-- Process data

## Data 

### Used data(Feb. 2021)

The data until mid Feburar 2021 will be included in the file `./graffiti-data/data/data.json`. Newer data can be requested [on the website of Stadt Zurich/züri-wie-neu](https://www.stadt-zuerich.ch/geodaten/download/Zueri_wie_neu?format=10009) via E-Mail. Download the data as `json` and replace it in the `data.json` file.

### Process data

To get the processedData, follow those steps:
- Open the terminal and navigate to `graffiti-in-zurich/graffiti-data` directory 
- Run `npm i` to install the dependencies
- Run `node index.js` to start the process
- The processed data will be found in the folder `graffiti-in-zurich/graffiti-data/data/processedData.json`

#### Methology

##### Filter the data

The data provided by züri-wie-neu contains all kind of service codes. From `Abfall/Sammelstelle` to `Strasse/Trottoir/Platz` and `Graffiti`. It seems that in the early days of this service, the service code `Graffiti` wasn't available, but often mentioned in the properties `service_notice`, `title`, `description` or `service_name`. 

Due to those circumstances the data will be filtered by all [those properties](https://github.com/philipkueng/graffiti-in-zurich/blob/main/graffiti-data/index.js#L65) before continuing: `service_code`, `service_notice`, `title`, `description` and `service_name` by the value `graffiti`. 


##### Get coordinates from data

