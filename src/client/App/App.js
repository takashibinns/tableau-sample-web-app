
//  Import CSS used throughout the application
import '@fortawesome/fontawesome-free/css/all.min.css';


import 'bootstrap-css-only/css/bootstrap.min.css';
import 'mdbreact/dist/css/mdb.css';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

//  Import dependencies used throughout the application
import React, { Component } from 'react';
import { ToastContainer, toast } from 'react-toastify';

//  Import Components
import Header from '.././Header/Header';
import Public from '.././Public/Public';
import Private from '.././Private/Private';

//  Define the navigation options
const navigation = {
  'links': [
    {
      'label':'Landing Page',
      'key':'landing-page',
      'visible': true,
    },
    {
      'label':'Most Popular',
      'key':'most-popular',
      'visible': true,
    },{
      'label':'Recent Activity',
      'key':'recent-activity',
      'visible': true,
    },{
      'label':'My Peers',
      'key':'peers',
      'visible': true,
    },{
      'label':'My Favorites',
      'key':'favorites',
      'visible': true,
    },{
      'label':'View',
      'key':'view',
      'visible': false,
    }] 
}

//  Function to check the current url (in case someone saved a bookmark/link), and set the navigation
function checkNavigation(){
  
  //  Check to see if a page is specified as part of the url
  var hash = window.location.hash.replace('#','').split('/');
  return {
    'page': hash[0],
    'viewId': hash[1]
  }
}

//  Export the main app
export default class App extends Component {

  //  Initialization
  constructor(props){
    super(props);

    //  Check to see if a page is specified as part of the url
    var nav = checkNavigation();

    //  Define the state of this component
    this.state = {
      'tableauSettings': {},
      'tableauSession': {},
      'tableauJs': null,
      'activePage': nav.page.length==0 ? navigation.links[0].key : nav.page,
      'lastPage': '',
      'embeddedViewId': nav.viewId,
    }

    //  Bind functions to this component
    this.handleUserChange = this.handleUserChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.loadTableauJS = this.loadTableauJS.bind(this);
  }

  //  Handle lifted state
  handleUserChange(tableauSession){

    //  TODO: Save the current session as a cookie



    //  Update this component's state
    this.setState({
      'tableauSession': tableauSession
    })
  }

  //  Handle navigation
  handlePageChange(newPage,viewId){

    //  Get the last page or default to the home page
    const page = (newPage.length>0) ? newPage : navigation.links[0].key;

    //  Update the state
    this.setState({
      'activePage': page,
      'lastPage': this.state.activePage,
      'embeddedViewId': viewId
    })
  }

  //  load tableau.js
  loadTableauJS(){

    //  Create a reference to this
    var thisComponent = this;

    //  Determine the URL to find the JS script
    var url = this.state.tableauSettings.server +  '/javascripts/api/tableau-2.2.2.min.js';
    //var url = 'https://public.tableau.com/javascripts/api/tableau-2.2.2.min.js';

    //  Create a script tag to load the JS library
    var script = document.createElement("script");
    script.src = url;
    script.type = "text/javascript";

    //  Add a handler to run, once the library has loaded
    script.onload = function(event) {
      
      //  TableauJS loaded, save a refernce to the tableau object
      thisComponent.setState({
        'tableauJs': window.tableau
      })
    }
    
    //  Add the script element to the page
    document.getElementsByTagName("head")[0].appendChild(script);
  }

  //  When the application loads, get the configuration settings from the web app and initialize Tableau.js
  componentDidMount() {

    //  Make an API callt o fetch the config settings
    fetch('/api/tableau/config')
      .then( res => res.json()) //  Convert the response to json
      .then( settings => {
        
        //  Update the state
        this.setState( { tableauSettings: settings} ) 
        
        //  Download the Tableau JS library, now that we know where the Tableau server is
        this.loadTableauJS();
      })
  }

  //  Render the main web application
  render() {
    
    //  Check to see if the user has authenticated to Tableau
    var isAuthenticated = this.state.tableauSession && this.state.tableauSession.apiKey;

    //  Decide what content to show, based on the user's session state (logged in/out)
    var content;
    if (isAuthenticated) {

      //  User is authenticated, pass along information to the Private component
      content = <Private tableauSettings={this.state.tableauSettings} 
                         tableauSession={this.state.tableauSession} 
                         activePage={this.state.activePage}
                         lastPage={this.state.lastPage}
                         tableauJs={this.state.tableauJs}
                         embeddedViewId={this.state.embeddedViewId}
                         onPageChange={this.handlePageChange}>
                </Private>

      //  Update the background
      document.body.className = 'c-private';

    } else {

      //  User is NOT authenticated, show the login screen
      content = <Public onUserChange={this.handleUserChange} 
                        tableauSettings={this.state.tableauSettings}>
                </Public>

      //  Update the background
      document.body.className = '';
    }
    
    //  Render the HTML
    return (
      <div>
        <Header onPageChange={this.handlePageChange} 
                onUserChange={this.handleUserChange}
                tableauSettings={this.state.tableauSettings}
                tableauSession={this.state.tableauSession}
                navigation={navigation}
                activePage={this.state.activePage}>

        </Header>
        {content}
        <ToastContainer />
      </div>
    );
  }
}
