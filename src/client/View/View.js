//	Import Dependencies
import React, { Component } from 'react';
import axios from 'axios';
import { tabGetTicket, tabGetViewThumbnails } from '.././tableau';

//	Define some constants for this component
const containerId = 'tableauViz';
const headerId = 'header';
const headerMargin = 48;

//	Define the View component
export default class View extends Component {

	//	Initialization
	constructor(props){
		super(props);

		//	Define the state of this component
		this.state = {
			tableauSession: this.props.tableauSession,
			tableauSettings: this.props.tableauSettings,
			trustedTicket: null,
			viewId: this.props.viewId,
			windowHeight: 0,
			view: null,
			viz: null,
			vizLoaded: false,
		}

		//	Bind functions to this component
		this.renderTableau = this.renderTableau.bind(this)
		this.getTrustedTicket = this.getTrustedTicket.bind(this)
		this.getViewFullUrl = this.getViewFullUrl.bind(this)
	}

	//	Get the trusted ticket for SSO
	getTrustedTicket(){

		//	Save a reference to the component
		var thisComponent = this;

		//	Get a trusted ticket from tableau server
		return tabGetTicket(this.state.tableauSession.user.trusted).then( response =>{
			
			//	Update the state w/ our new ticket
			thisComponent.setState({
				'trustedTicket': response.ticket
			})
		})
	}

	//	Create the url for the view (including site and trusted ticket path)
	getViewFullUrl(view){

		//	Are we using trusted tickets for SSO?
		var useTickets = this.state.tableauSettings.useTrustedTicketSSO;
		if (useTickets) {
	
			//	Define the base url
			var baseUrl = this.state.tableauSettings.server + '/trusted/' + this.state.trustedTicket;

			//	Check for a trusted ticket
			if (this.state.trustedTicket) {

				//	Check to see if we've logged into a site
				if (this.state.tableauSession.site.name.length==0) {
					//	Using default site
					return baseUrl + view.links.embed;
				} else {
					//	Not the default site
					return baseUrl + '/t/' + this.state.tableauSession.site.name + view.links.embed;
				}
			} else {

				//	Not yet authorized, get a ticket but return null for now
				this.getTrustedTicket();
				return null;
			}
		} else {

			//	Using a different form of SSO, just make a regular embed url

			//	Check to see if we've logged into a site
			if (this.state.tableauSession.site.name.length==0) {
				//	Using default site
				return this.state.tableauSettings.server + view.links.embed;
			} else {
				//	Not the default site
				return this.state.tableauSettings.server + '/t/' + this.state.tableauSession.site.name + view.links.embed;
			}

		}
	}

	//	Function to run, every time we try to render the view
	renderTableau(view,origin) {

		//	Save a reference to this component
		var thisComponent = this;

		//	Make sure there's a view passed to this component
		if (view) {

			//	Find the container to render into
			var containerDiv = document.getElementById(containerId),
				headerElement = document.getElementById(headerId);

			//	Calculate the height to take up as much space as possible (based on user's browser)
			var newHeight = this.state.windowHeight - (headerElement.offsetHeight + 56 + (2*headerMargin));

			//	Get details for the view to display
			var url = this.props.view ? this.getViewFullUrl(this.props.view) : null,
	            options = {
	                hideTabs: true,
	                hideToolbar: true,
	                height: newHeight + 'px',
	                width: '100%',
	                onFirstInteractive: function (event) {
	                    //	Update the state of this component, to reflect that the viz is ready to communicate
	                    thisComponent.setState({'vizLoaded':true})
	                },
	                onFirstVizSizeKnown: function (event) {

	                	//	Safely get the new height to use
	                	try {
		                	//	Get the height of the rendered viz
		                	const newHeight = event.$2.sheetSize.maxSize.height;

		                	//	Update the iframe to match the viz height (stick w/ 100% width)
		                	thisComponent.state.viz.setFrameSize("100%",newHeight);

	                	} catch {
	                		console.log('Error getting the height of the viz')
	                	}
	                }
	            };

	        //	Check to make sure we've got a valid url for the view
	        if (url) {

	        	//	URL is good, has a view already been loaded into this container?
		        if (this.state.viz){

		        	//	Yes, there is already a viz loaded.  Are they the same viz?
		        	if (this.state.view.id === view.id) {

		        		//	Yes it's the same viz, no need to reload it so do nothing

		        	} else {

		        		//	Its a new viz, need to remove the old one
		        		this.state.viz.dispose();

		        		// Create a viz object and embed it in the container div.
		        		var viz = new this.props.tableauJs.Viz(containerDiv, url, options);
				        this.setState({
				        	'viz': viz,
				        	'view': view
			        	})

		        	}
		        } else {

		        	//	No, this is a brand new viz
		            //  Create a viz object and embed it in the container div.
		            var viz = new this.props.tableauJs.Viz(containerDiv, url, options);
			        this.setState({
			        	'viz': viz,
			        	'view': view
		        	})
			    }
	        } else {

	        	//	Need to get a trusted ticket, before we can load the viz
	        	this.getTrustedTicket();
	        }

	        
    	}
	}

	//	Detect the user's browser dimensions, and set to the state
	componentWillMount(){
		this.setState({ windowHeight: window.innerHeight });
      }

	//	Render the viz, after the div element has been created
	componentDidMount(){
		this.renderTableau(this.props.view,'mount');
	}

	//	Properties passed to this component have updated, try rendering again
	componentDidUpdate(){
		this.renderTableau(this.props.view,'update') 
	}

	//	Release the viz from memory, when this component unmounts
	componentWillUnmount(){
		if (this.state.viz) {
			this.state.viz.dispose();
		}
	}
	
	//	Render the placeholder HTML for this viz
	render() {

		//	Define placeholder object for the view (since it won't be passed until the API calls have completed)
		const view = this.props.view ? this.props.view : {}

		//	Main render return
		return (
			<section className="my-5">
			  <h2 id={headerId} className="h1-responsive font-weight-bold text-center c-view-header">{view.name}</h2>
			  <div id={containerId}></div>
			</section>
		)
	}
}