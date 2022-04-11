# Installation Instructions

## Enable CORS on your Tableau Server
In order for the web app to communicate with your Tableau Server, you must enable CORS first.  The official Tableau instructions can be found [here](https://onlinehelp.tableau.com/current/api/rest_api/en-us/REST/rest_api_concepts_fundamentals.htm#enabling-cors-on-tableau-server-for-the-rest-api), but the relevant tsm commands (run on your tableau server) can be found below.  Just swap in the hostname/ip of the machine you are installing this web app on.  If you are just trying out this web app on your laptop/workstation, you can enter 'http://localhost:3000' as the origin to allow.

```
tsm configuration set -k vizportal.rest_api.cors.enabled -v true
tsm configuration set -k vizportal.rest_api.cors.allow_origin -v <web-app-host-server>
tsm pending-changes apply
```

This step is first, as it requires a Tableau Server restart.

## Download/Install the prerequisite software

### Git
This is optional, as it's only used to make downloading the source code easier.  You can follow the instructions on [https://git-scm.com/downloads](https://git-scm.com/downloads) to download and install for either windows/mac/linux.

### Node / Yarn
Node is a JavaScript runtime, that we're using to run the web app.  Yarn is a package manager, which helps manage what dependencies are required for software projects.  We need both of them in order to setup/run this web application.

Please the follow the instructions for both [Node](https://nodejs.org/en/download/) and [Yarn](https://yarnpkg.com/lang/en/docs/install/) before continuing.

## Download the web app's repository
Open up Terminal (mac) or the Command Prompt (windows) and change the directory to wherever you want to save these files.  Then use the commands below to download this web app's source code and move into that directory.
```
# Clone the repository
git clone https://github.com/takashibinns/tableau-sample-web-app

# Go inside the directory
cd tableau-sample-web-app
```
## Configure your settings
From the files you just downloaded, open the *src/server/config.js* file and change the properties to match your server.  The most important thing is to change the *server*, *landing page project*, & *admin user/password* settings.  This will make sure the app is properly leveraging your Tableau Server.

```
const config = {

  //  This section of config settings is shared client side (browser)
  'public': {
    
    //  What is the URL of your Tableau Server? This should include protocol (http:// or https//) and port (if not 80 or 443)
    'server': '<https://my-tableau-server>',
    
    //  What is the name of the site should we authenticate to? leave blank for the default site
    'site': '',
    
    //  What version of the REST API should we use?
    'apiVersion': '3.1',
    
    //  How many seconds until an authentication token is expired? default setting on TS is 240 minutes
    'apiTokenExpiration': 240,
    
    //  Should this application provide SSO for embedded views? set to either 'ConnectedApp' or 'TrustedTicket' if needed, or null if using a different authentication method
    'singleSignOn': 'ConnectedApp',
    
    //  Title of this web application
    'appName': 'My Healthcare Portal',
    
    //  The default page of this app pulls all dashboards from a specific project, enter the project you want to use below
    'landingPageProject': '<The name of a project on your Tableau Server>',
    
    //  How long does your Tableau Repository retain data (183 days by default)
    'eventDataDurationLabel' : '6 months'
  },
  
  //  This section of config settings never leaves the server
  'private': {
    
    //  Encryption key (server side only, you can change this to any string value)
    'cryptoKey': 'MySecureKey',
    
    //  Tableau Server Admin Credentials (used to fetch data from published workbooks)
    'adminUser': '<some-admin-user>',
    'adminPassword': '<admin-user-password>',
    
    //  Name of the workbook, that contains server data (recently viewed content, peer groups, comments, etc)
    'adminWorkbook':'ServerUsage',
    
    //	Connected App secret details (from Tableau Server)
		'connectedAppSecretId': '<connected-app-secret-id>',
		'connectedAppSecretValue': '<connected-app-secret-value>',
		'connectedAppClientId': '<connected-app-client-id>',
  }
}
```

## Publish the ServerUsage workbook
In order to get a user's usage data, a Tableau Workbook was created that makes queries against your Tableau Server's Postgres Repository.  Open the included workbook (*/server-usage/ServerUsage.twb*) and change the connection settings to point to your Tableau Server.  This is similar to how the admin views work within Tableau Server.  You can find help getting this setup, by following the instructions [here](https://onlinehelp.tableau.com/current/server/en-us/perf_collect_server_repo.htm).  When you publish this workbook make sure it's available to the *tableau user* specified in your config.js file.  When this application loads it makes an API call to query for the data within this workbook, and those API calls are made under the context of the *tableau user*.  To ensure security, the web app's logged-in user's id and the site id are passed as a filter parameters in the API call.  

Depending on how large your user base is, you will likely want to create switch this workbook's data source from a live connection to a Tableau Extract.  This will reduce the query load on your Tableau Repository, and keep Tableau Server running smoothly.

Please note that the custom sql provided in this workbook was developed using Tableau Server 2019.2, and different versions of Tableau Server may have slightly different schemas.  If your workbook gives you a sql error, you may need to adjust the custom sql (found at server-usage/repository.sql) and replace the workbook's data source. 

## Start the application
This document assumes use of Yarn as the package manager, but it is possible to run with NPM (installed w/ node).  From within this web app's directory, run the following commands depending on what you want to do.  If just testing on your local laptop/workstation, run just the first 2 commands.

```
# Install dependencies
yarn (or npm install)

# Start development server
yarn dev (or npm run dev)

# Build for production
yarn build (or npm run build)

# Start production server
yarn start (or npm start)
```
 
