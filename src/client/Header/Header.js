//  Import Dependencies
import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Dropdown from 'react-bootstrap/Dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faSearch } from '@fortawesome/free-solid-svg-icons'
import { tabLogout, tabDateFormatter } from '.././tableau';
import './Header.css';

//  Define the Header component
export default class Header extends Component {
  
  //  Initialization
  constructor(props){
    super(props);

    //  Define the state of this component
    this.state = {
      tableauSession: this.props.tableauSession,
      tableauSettings: this.props.tableauSettings,
      navigation: this.props.navigation,
    }

    //  Bind functions to this
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  
  //  User clicked a link in the nav bar
  handlePageChange(event){

    //  Figure out what page they clicked on
    var newPage = event.currentTarget.hash.replace('#','');

  	//	Set the state at this level
    this.setState({
      'activePage': newPage
    })

    //	Lift state up to top level, to let the rest of the application know
    this.props.onPageChange(newPage)
  }

  handleLogout(event) {

    //  Save a reference to this component
    var thisComponent = this;

    //  Make the API call to log out
    tabLogout(this.props.tableauSettings, this.props.tableauSession)
      .then( result => {

        //  Lift the state change up to the top level
        thisComponent.props.onUserChange(result)
      })
  } 

  //  Render this component
  render() {

    //  Save a reference to this component
    var thisComponent = this;

    //  Is the user logged in?
    const isLoggedIn = this.props.tableauSession && this.props.tableauSession.apiKey;

    //  Initialize variables for the nav bar
    var leftNav,
        rightNav;

    //  Only show the full naviation if the user is logged in
    if (isLoggedIn) {

      //  Get the current user, and the active page
      var user = this.props.tableauSession.user,
          activePage = this.props.activePage;
      
      //  Get the nvagition info, and build the controls
      var navLinks = this.props.navigation.links.filter( link => {
        //  Filter the nav bar, to only show items marked as 'visible'
        return link.visible;
      }).map((link,key) => {
        //  Create a Nav.Link component for each item
        return <Nav.Link key={key} active={link.key==activePage} href={'#' + link.key} onClick={thisComponent.handlePageChange} >{link.label}</Nav.Link>
      })
      
      //  Define the left side of the nav bar (nav links)
      leftNav = <Nav className="mr-auto">
                  {navLinks}
                </Nav>
      
      //  Define the right side of the nav bar (search bar & user info)
      rightNav = <Form inline>
                    {/*
                    <FormControl type="text" placeholder="Search" className="mr-sm-2" />
                    <FontAwesomeIcon icon={faSearch} />
                    */}
                    <Dropdown as={Nav.Item}>
                      <Dropdown.Toggle as={Nav.Link}>
                        <FontAwesomeIcon icon={faUser} />
                        {user.name}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item disabled={true}><strong>Role</strong>: {user.role}</Dropdown.Item>
                        <Dropdown.Item disabled={true}><strong>Last Login</strong>: { tabDateFormatter(user.lastLogin) }</Dropdown.Item>
                        <Dropdown.Item onClick={this.handleLogout}><strong>Log Out</strong></Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                 </Form>
    }

    //  Render the component
    return (
      <Navbar expand="lg" fixed="top" className="navbar scolling-navbar">
        <div className="container">
  		    <Navbar.Brand href="#home">
  		      <img src="/public/logo.png" className="d-inline-block align-top c-header-image"/>
  		      {this.props.tableauSettings.appName}
  		    </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            { leftNav }
            { rightNav }
          </Navbar.Collapse>
        </div>
		  </Navbar>
    );
  }
}




