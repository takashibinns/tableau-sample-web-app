# Sample web app for Tableau Server
This project contains an example of what a modern web application or portal can look like, when integrating with Tableau Server.  It leverages the Tableau REST API to authenticate & fetch data, and allows users to view dashboards embedding right in the app.  This project is based on the [simple-react-full-stack](https://github.com/crsandeep/simple-react-full-stack) project by [Sandeep Raveesh](https://github.com/crsandeep).  His project was used as a starting point, and the tableau specific content was added on top.

An important thing to note, is that this web app leverages your Tableau Server's Postgres Repository to access usage information.  Since direct access to the repository is not allowed for Tableau Online, this web app will not work if you are using Tableau Online.

# Installation / Setup
Follow the instructions on [this page](https://github.com/takashibinns/tableau-sample-web-app/blob/master/setup.md) in order to get the application installed and configured.
 
# Overview
This is a full stack web app built using React, Node.js, Express and Webpack. It is also configured with webpack-dev-server, eslint, prettier and babel.

## Development mode
In the development mode, we will have 2 servers running. The front end code will be served by the webpack dev server which helps with hot and live reloading. The server side Express code will be served by a node server using nodemon which helps in automatically restarting the server whenever server side code changes.

## Production mode
In the production mode, we will have only 1 server running. All the client side code will be bundled into static files using webpack and it will be served by the Node.js/Express application.

## Folder Structure
- *server-usage*: the Tableau workbook, for monitoring usage on your Tableau Server
- *screenshots*: Images used for this readme
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
