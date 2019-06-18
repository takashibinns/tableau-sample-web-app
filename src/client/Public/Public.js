//	Import Dependencies
import React, { Component } from 'react';
import Background from '../../../public/background-public.png';
import { tabLogin } from '.././tableau';
import './Public.css';

//	Define some constants for this component
const formIds = {
	'email': 'formBasicEmail',
	'password': 'formBasicPassword'
}

//	Define the Public component
export default class Public extends Component {

	//	Initialization
	constructor(props){
		super(props);

		//	Define the state of this component
		this.state = {
			tableauSession: this.props.tableauSession,
			tableauSettings: this.props.tableauSettings,
			loginError: false,
			show: false
		}

		//	Bind functions to this component
		this.tableauLogin = this.tableauLogin.bind(this);
	}

	//	User clicked the SIGN IN button, so try to authenticate to Tableau Server
	tableauLogin(event) {

		//	Prevent the form from reloading the web page
		event.preventDefault();

		//	Get the email/password from the login form
		var inputs = {
			'email': document.getElementById(formIds.email).value,
			'password': document.getElementById(formIds.password).value,
		}

		//	Save a reference to this
		var thisComponent = this;

		//	Make the API call to login to Tableau Server
		tabLogin(this.props.tableauSettings, inputs.email, inputs.password).then( response => {
				
				if (response.error) {
					thisComponent.setState({
						loginError: true
					})
				} else {

					//	Update the local state
					thisComponent.setState({
						tableauSession: response,
						loginError: false,
						show: false,
					})

					//	Lift the state up
					thisComponent.props.onUserChange(response)
				}	
			})

	}

	//	Render the login page
	render() {
		return (
			<main>
			    <div className="view full-page-intro" 
			    	 style={{ "backgroundImage":`url(${Background})`, 
			    	 		 "backgroundRepeat": "no-repeat", 
			    	 		 "backgroundSize": "cover"}}>
			    <div className="mask rgba-black-light d-flex justify-content-center align-items-center">
			      <div className="container">
			        <div className="row wow fadeIn animated" style={{"visibility": "visible", 
			        												"animationName": "fadeIn"}}>
			          <div className="col-md-6 mb-4 white-text text-center text-md-left">
			            <h1 className="display-4 font-weight-bold" style={{"color":"white"}}>Welcome to the Healthcare Portal</h1>
			            <hr className="hr-light"></hr>
			            <p>
			              <strong>Login with your Tableau credentials</strong>
			            </p>
			            <p className="mb-4 d-none d-md-block">
			              Once logged in, you have access to all your Tableau dashboards & reports
			            </p>
			          </div>
			          <div className="col-md-6 col-xl-5 mb-4">
						<div className="card">
						  <h5 className="card-header info-color white-text text-center py-4">
						    <strong>Sign in</strong>
						  </h5>
						  <div className="card-body px-lg-5 pt-0">
						    <form className="text-center " style={{"color": "#757575"}}
						    	  onSubmit={this.tableauLogin}>
						      <div className="md-form ">
						        <input type="text" id={formIds.email} className="form-control"></input>
						        <label className="active">Username</label>
						      </div>
						      <div className="md-form">
						        <input type="password" id={formIds.password} className="form-control"></input>
						        <label className="active">Password</label>
						      </div>
						      <button className="btn btn-outline-info btn-rounded btn-block my-4 waves-effect z-depth-0" 
						      		type="submit" >Sign in</button>
						    </form>

						  </div>

						</div>
			          </div>
			        </div>
			      </div>
			    </div>
			  </div>
			</main>
		)
	}
}
