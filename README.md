# Sample web app for Tableau Server
This project contains an example of what a modern web application or portal can look like, when integrating with Tableau Server.  It leverages the Tableau REST API to authenticate & fetch data, and allows users to view dashboards embedding right in the app.  This project is based on the [simple-react-full-stack](https://github.com/crsandeep/simple-react-full-stack) project by [Sandeep Raveesh](https://github.com/crsandeep).  His project was used as a starting point, and the tableau specific content was added on top.

# Quickstart
## Download this repository
```
# Clone the repository
git clone https://github.com/takashibinns/tableau-sample-web-app

# Go inside the directory
cd tableau-sample-web-app
```
## Configure your settings
Open the src/server/config.js file and change the properties to match your server.  The most important thing is to change the *server* and admin user/password settings.  This will make sure the app is leveraging your Tableau Server.

```
const config = {
  //  This section of config settings is shared client side (browser)
  'public': {
    //  What is the URL of your Tableau Server? This should include protocol (http:// or https//) and port (if not 80 or 443)
    'server': 'https://my-tableau-server',
    //  What is the name of the site should we authenticate to? leave blank for the default site
    'site': '',
    //  What version of the REST API should we use?
    'apiVersion': '3.1',
    //  How many seconds until an authentication token is expired? default setting on TS is 240 minutes
    'apiTokenExpiration': 240,
    //  Should this application provide SSO for embedded views? set to false if you have already setup SSO on your tableau server
    'useTrustedTicketSSO': false,
    //  Title of this web application
    'appName': 'My Healthcare Portal',
    //  Landing Page project
    'landingPageProject': 'Population Health Analytics',
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
  }
}
```

## Publish the ServerUsage workbook
In order to get a user's usage data, a Tableau Workbook was created that makes queries against your Tableau Server's Postgres Repository.  Open the included workbook and change the connection settings to point to your Tableau Server.  This is similar to how the admin views work within Tableau Server.  You can find help getting this setup, by following the instructions [here](https://onlinehelp.tableau.com/current/server/en-us/perf_collect_server_repo.htm).  When you publish this workbook make sure it's available to all users.  When this application loads it makes an API call to query for the data within this workbook, and those API calls are made under the context of the logged in user.  

Please note that the custom sql provided in this workbook was developed using Tableau Server 2019.2, and different versions of Tableau Server may have slightly different schemas.  If your workbook gives you a sql error, you may need to adjust the custom sql (found at server-usage/repository.sql) and replace the workbook's data source. 

## Start the application
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
 
# Overview
This is a full stack web app built using React, Node.js, Express and Webpack. It is also configured with webpack-dev-server, eslint, prettier and babel.

## Development mode
In the development mode, we will have 2 servers running. The front end code will be served by the webpack dev server which helps with hot and live reloading. The server side Express code will be served by a node server using nodemon which helps in automatically restarting the server whenever server side code changes.

## Production mode
In the production mode, we will have only 1 server running. All the client side code will be bundled into static files using webpack and it will be served by the Node.js/Express application.

## Folder Structure
- *public*: contains static files such as images, icons, and the root html page.
- *src*: where all the source code for this project lives
  - *server*: contains all server side code, which manages the app's rest api handlers and server side api calls
  - *client*: contains all client-side code, which is the react application, components, and utility functions

# Sample Pages

## Login
![Image of Login Page](/screenshots/login.png)
A simple login form that prompts the client for a username/password.  The application passes these details to the Tableau server, and attempts to authenticate using the REST API.  The user account specified during login, is used for all subsequent API calls to ensure permissions.  

## Landing Page
![Image of Landing Page](/screenshots/landing-page.png)
This is the default home page when you first login to the application.  This page uses the *landingPageProject* property from the config file, and displays all the dashboards within that project.  You can click on the dashboard image or title, to view the embedded version of that dashboard.

## Most Popular
![Image of Most Popular](/screenshots/most-popular.png)
This page displays a carousel slideshow of the top 12 views based on usage.  Each view has a card which shows the screenshot of the view on the front, and displays some supporting information (owner, project, last updated, etc) on the back.  You can see the back of each card, but hovering your mouse over it.  The back of the card also lets you download view as an image, pdf, or csv file.  End users also have the option to filter the views based on the project and workbook owner.

## Recent Activity
![Image of Recent Activity](/screenshots/recent-activity.png)
This page shows 2 forms of recent activity.  The left side of the page is a timeline of the logged in user's recently viewed dashboards.  The right side shows a timeline of comments people have made within Tableau views.  You can click on the titles of each view to see the embedded version of it.

## My Peers
![Image of My Peers](/screenshots/peer-usage.png)
This page displays a sankey diagram showing the top 10 most active users within the same user group as the logged in users, as well as the top 10 dashboards these users are viewing.  The goal of this page is to help see what dashboards your peers are using, as maybe you should be using them as well.  Hovering over the relationship line between a user and view will show you a tooltip with the usage counts for that user-view combination.  Clicking on a view will open it in an embedded view.

## My Favorites
![Image of My Favorites](/screenshots/favorites.png)
This page shows a list of all the views you have marked as favorites within Tableau.  This is done by clicking the small star icon in a view's toolbar.
![Image of the Tableau toolbar](/screenshots/favorites-icon.png)
