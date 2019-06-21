//	Import Dependencies
import React, { Component } from 'react';
import axios from 'axios';
import { Container, Row, Col, Modal} from 'react-bootstrap';
import { toast } from 'react-toastify';
import {Timeline, TimelineBlip, TimelineEvent} from 'react-event-timeline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCommentDots, faArrowCircleUp, faFileImage, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import ViewDenied from './ViewDenied';
import { tabGetTicket, tabGetUsageData, tabGetViewData } from '.././tableau';
import { objectIsEmpty } from '.././utility';
import LoadingImage from '../../../public/loading.svg';
import './View.css';

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
			usagedata: this.props.usagedata,
			commentsVisible: false,
			lastPage: this.props.lastPage,
		}

		//	Save a reference to the update handler function
		var updateUsageData = this.props.onUsageUpdated;

		//	Do we already have usage data?
		if (objectIsEmpty(this.props.usagedata)) {

			//	Not yet, so make the API call
			tabGetUsageData(this.props.tableauSession).then( response => {
				
				//	Got the data, lift the state
				updateUsageData(response)
			})
		}

		//	Bind functions to this component
		this.renderTableau = this.renderTableau.bind(this)
		this.getTrustedTicket = this.getTrustedTicket.bind(this)
		this.getViewFullUrl = this.getViewFullUrl.bind(this)
		this.showComments = this.showComments.bind(this)
		this.handleCloseComments = this.handleCloseComments.bind(this)
		this.downloadView = this.downloadView.bind(this)
		this.goBack = this.goBack.bind(this)
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
		if (view && !view.error) {

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

	//	Function to display the comments for this view
	showComments() {
		this.setState({
			'commentsVisible': true
		})
	}

	//	Function to hide the comments modal
	handleCloseComments() {
		this.setState({
			'commentsVisible': false
		})
	}

	//	Function to download the view as a file
	downloadView(event){
		
		//	What kind of file to download?
		var type = event.currentTarget.getAttribute('rel'),
			  view = this.props.view;

		//	Double check to make sure a view is loaded
		if (view && !view.error) {
			//	Download the data
			tabGetViewData(this.props.tableauSession, view, type)
		} else {
			//	Handle invalid state
			if (view) {
				//	Show an info popup because the view isn't loaded
				toast.info("The view has not fully loaded, please wait and try again", {
			        position: toast.POSITION.TOP_RIGHT
			    })
			} else {
				//	Show the error message
				toast.error(view.error, {
			        position: toast.POSITION.TOP_RIGHT
			    })
			}
		}
	}

	//	Function to go back to the previous page
	goBack() {
		this.props.onPageChange(this.props.lastPage)
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

		//	Save a reference to this component
		var thisComponent = this;

		//	Define placeholder object for the view (since it won't be passed until the API calls have completed)
		const view = this.props.view ? this.props.view : {};

		//	Create placeholder for comments
		const comments = (usageData) => {

			//	Has the usage data finished loading?
			const dataComplete = !objectIsEmpty(this.props.usagedata)
			if (dataComplete) {

				//	Safely get a reference to the current view's di
				const thisViewId = (view && view.id) ? view.id : "N/A";

				//	Filter the list of comments to only this view
				const thisViewComments = usageData['comments'].filter( comment =>{
					return comment.ViewId.toLowerCase() === thisViewId;
				})

				//	Define a function to sort the comments by date
				const comparison = (a,b) => {
					const aDate = new Date(a.Date),
						  bDate = new Date(b.Date);
					if (aDate> bDate) {
						return -1
					} else if (aDate < bDate) {
						return 1;
					} else {
						return 0
					}
				} 

				//	Define what shows up, if there are no comments for this view
				const noComments = 	<TimelineBlip title="No comments for this view">
					            	</TimelineBlip>  

				//	Loop through each comment, and create a timeline event
				const events = thisViewComments.sort(comparison).map((data,key) => {

					//	Define the subtitle, with a hyperlink to the view
					const eventSubtitle =  <span className="c-recent-activity-comment" key={key}>commented on 
											  <a href={'#view/' + data.ViewId.toLowerCase()} rel={data.ViewId} onClick={thisComponent.handleOpenView}>
												{" " + data.ViewName}
											  </a>
										   </span>

					//	Define the event details
					return <TimelineEvent title={data.commentUsername}
										  subtitle={eventSubtitle}
				                          createdAt={data.Date}
				                          key={key}
				                          icon={<FontAwesomeIcon icon={faCommentDots} className="mr-1"/>}
				            >
				            	{data.comment}
				            </TimelineEvent>
		        })

				//	Return the full timeling
				return  <Timeline >
				       		{ events.length>0 ? events : noComments }   
			       		</Timeline>

			} else {

				//	Still loading, show the loading spinner
				return  <Timeline >
				       		<TimelineBlip title="Loading comments">
			            		<img src={LoadingImage} className="c-activity-loading"></img>
			            	</TimelineBlip>    
				       	</Timeline>
			}
		}

		//	Main render return
		return (
			<section className="my-5">
				<Container>
					<Row>
						<Col>
			  				<h2 id={headerId} className="h1-responsive font-weight-bold text-center c-view-header">{view.name}</h2>
		  				</Col>
		  				<Col>
		  					<h2 className="c-view-toolbar">
						  		<FontAwesomeIcon icon={faCommentDots} className="mr-1" onClick={this.showComments}/>
						  		<FontAwesomeIcon icon={faFileImage} className="mr-1" rel="png" onClick={this.downloadView}/>
						  		<FontAwesomeIcon icon={faFilePdf} className="mr-1" rel="pdf" onClick={this.downloadView}/>
						  		<FontAwesomeIcon icon={faFileExcel} className="mr-1" rel="csv" onClick={this.downloadView}/>
						  		<FontAwesomeIcon icon={faArrowCircleUp} className="mr-1" onClick={this.goBack}/>
					  		</h2>
				  		</Col>
			  		</Row>
		  		</Container>
		  		<Modal show={this.state.commentsVisible} onHide={this.handleCloseComments}>
		          <Modal.Header closeButton>
		            <Modal.Title>Recent Comments</Modal.Title>
		          </Modal.Header>
		          <Modal.Body>
		          	{ comments(this.props.usagedata) } 
		          </Modal.Body>
		        </Modal>
			  	<ViewDenied error={view.error}></ViewDenied>
			  	<div id={containerId}></div>
			</section>
		)
	}
}