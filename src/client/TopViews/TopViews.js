//	Import dependencies
import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileImage, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import Carousel from 'nuka-carousel';
import { Row, Col} from 'react-bootstrap';
import Flippy, { FrontSide, BackSide } from 'react-flippy';
import Select from 'react-select';
import Form from 'react-bootstrap/Form';
import makeAnimated from 'react-select/lib/animated';
import axios from 'axios';
import { tabGetViewThumbnails, tabGetViewData, tabDateFormatter } from '.././tableau';
import './TopViews.css';

//	Define constants for this page
const loadingImage = "/public/loading.gif";
const dashboardsOnlyId = "filter-dashboards-only";
const tableauImageClass = "tableau-img";	//	TODO: still hardcoded within className
const topCount = 12;
const viewsPerPage = 4;

//	These CSS attributes needed to be set as style properties...
const filterStyle = {
	'textAlign': 'left',
	'fontSize': '1em',
}
const filterLabelStyle = {
	'textOverflow': 'ellipsis',
	'whiteSpace': 'nowrap',
	'overflow': 'hidden',
	'textAlign':'right',
	'fontSize':'1.25em',
	'lineHeight': '2em',
}

//	Define the TopViews component
export default class TopViews extends Component {

	//	Initialization
	constructor(props){
		super(props);

		//	Define the state of this component
		this.state = {
			tableauSession: this.props.tableauSession,
			tableauSettings: this.props.tableauSettings,
			projects: this.props.projects,
			selectedProjects: [],
			owners: this.props.owners,
			selectedOwners: [],
			dashboardsOnly: true,
			allViews: this.props.allViews,
			slidesPerPage: 4,
		}

		//	Bind functions to this component
		this.handleOpenView = this.handleOpenView.bind(this);
		this.handleFileDownload = this.handleFileDownload.bind(this);
		this.handleProjectSelections = this.handleProjectSelections.bind(this);
		this.handleOwnerSelections = this.handleOwnerSelections.bind(this);
		this.handleTypeSelections = this.handleTypeSelections.bind(this);
		this.updateSlidesToShow = this.updateSlidesToShow.bind(this);
	}
	
	//	Handle when a user clicks on a view to open
	handleOpenView(event) {

		//	Determine the view id
		var viewId = event.target.getAttribute('rel');

		//	Notify parent of the view to embed
		this.props.onOpenView(viewId);
	}

	//	Handle file downloads
	handleFileDownload(event){

		//	Watch out for double-clicks
		event.preventDefault();

		//	Get a reference to the button (user may have clicked on the icon)
		var button = event.target.nodeName === 'svg' ? event.target.parentElement : event.target;

		//	Determine the view id
		var viewId = button.getAttribute('rel'),
			type = button.innerText.trim().toLowerCase();

		//	Look for the specific view
		var view = this.props.allViews.find( v => { return v.id === viewId; });
		if (view) {

			//	Download the file
			tabGetViewData(this.state.tableauSession, view, type)
		}
	}

	//	Handle filter changes
	handleProjectSelections(selections,action){
		this.setState({
			'selectedProjects': selections
		})
	}

	//	Handle filter changes
	handleOwnerSelections(selections,action){
		this.setState({
			'selectedOwners': selections
		})
	}

	//	Handle filter changes
	handleTypeSelections(event){
		
		//	Update the state
		this.setState( {
			dashboardsOnly: event.target.checked	
		})
	}

	//	Add window listener, to detect browser size changes
	componentDidMount() {
	  this.updateSlidesToShow();
	  window.addEventListener('resize', this.updateSlidesToShow);
	}

	//	Remove window listener, when leaving this view
	componentWillUnmount() {
	  window.removeEventListener('resize', this.updateSlidesToShow);
	}

	//	Calculate the number of slides to display, based on the browser width
	updateSlidesToShow() {

		//	Get the window width, and define the max width per slides
		var width = window.innerWidth,
			numSlides = Math.floor( window.innerWidth / 510 ) + 1;

		//	Update the state
		this.setState({
			slidesPerPage: numSlides
		})
	}

	//	Render the component
	render() {

		//	Create a reference to this component
		var thisComponent = this;

		//	Function to sort the views based on usage
		function sorter(a, b) {

			var usageA = parseInt(a.usage.totalViewCount),
				usageB = parseInt(b.usage.totalViewCount),
				comparison = 0;
		  
		  	if (usageA > usageB) {
		    	comparison = -1;
		  	} else if (usageB > usageA) {
		    	comparison = 1;
		  	}
		  	return comparison;
		}

		//	Check to see if any filters were set
		var filterSet = ((this.state.selectedProjects.length + this.state.selectedOwners.length) > 0) || this.state.dashboardsOnly;
		
		//	Function to filter the list of views
		function myFilter(view) {

			//	Init checkers
			var projectValid = false,
				ownerValid = false,
				typeValid = false;

			//	Check project
			var projects = thisComponent.state.selectedProjects;
			if (projects.length>0) {

				//	Loop through each selected project
				projects.forEach( project => {

					//	Compare the selected project to the view's project
					if (project.value == view.project.id) {
						projectValid = true;
					}
				})
			} else {
				projectValid = true;
			}

			//	Check owners
			var owners = thisComponent.state.selectedOwners;
			if (owners.length>0) {

				//	Loop through each selected project
				owners.forEach( owner => {

					//	Compare the selected project to the view's project
					if (owner.value == view.owner.email) {
						ownerValid = true;
					}
				})
			} else {
				ownerValid = true;
			}

			//	Check view type (view or dashboard)
			if (thisComponent.state.dashboardsOnly) {
				typeValid = (view.sheetType === 'dashboard');
			} else {
				typeValid = true;
			}
			
			//	Only keep views that match the select project AND owner
			return (projectValid && ownerValid && typeValid);
		}

		//	Get the top X views (not all of them)
		var topViews = filterSet ? this.props.allViews.filter(myFilter).sort(sorter).slice(0,topCount) : this.props.allViews.sort(sorter).slice(0,topCount);

		//	Create an array to hold any views that don't have a cached thumbnail
		var viewsToUpdate = [];
		
		//	Check the views, to see if any require a thumbnail to be downloaded
		topViews.forEach( (view, index) => {

			//	Do we have a cached thumbnail for this view?
			if (!view.data.thumbnail) {

				//	Add this view to the list to update
				viewsToUpdate.push(view)
			}
		})

		//	Update the views w/ no thumbnails
		tabGetViewThumbnails( this.props.tableauSettings, this.props.tableauSession, viewsToUpdate)
			.then (newViews => {

				//	Only update if there are new views
				if (newViews.length > 0) {

					//	pass the new view data up to top level
					thisComponent.props.onViewUpdates(newViews,'thumbnail');
				}
				
			})

	    //	Build the slides, based on the top views
		var slides = topViews.map((view,key) => {

			//	Check to see if we've already loaded the thumbnail
			var initialImage = view.data.thumbnail ? view.data.thumbnail : loadingImage;

			//	Create a card for each view
		    return <div key={key}>
			    		<Flippy flipOnHover={true} // default false
							   flipOnClick={false} // default false
							   flipDirection="horizontal" // horizontal or vertical
							   ref={(r) => this.flippy = r} // to use toggle method like this.flippy.toggle()
						>
						    <FrontSide className="c-flippy-front">
						      	<h4 className="font-weight-bold mt-4">{view.name}</h4>
						      	<div className="avatar mx-auto">
				                	<img id={view.id} src={initialImage} className=" img-fluid tableau-img"></img>
					            </div>
					            <h6 className="font-weight-bold my-3">Project: {view.project.name}</h6>
					            <h6 className="my-3">Total Views: {view.usage.totalViewCount}</h6>
						    </FrontSide>
						    <BackSide className="c-flippy-back">
						      	<h4 className="font-weight-bold mt-4">{view.name}</h4>
						      	<div className="grey-text c-flippy-header">
					                <h6>Owner: <strong>{view.owner.fullName}</strong></h6>
					                <h6>Last Updated: <strong>{tabDateFormatter(view.updatedAt)}</strong></h6>
					            </div>
					            <hr></hr>
					            <div className="grey-text c-flippy-header" >
					                <h6>Project:</h6>
					                <h6><strong>{view.project.name}</strong></h6>
					            </div>
					            <hr></hr>
					            <a href={'#view/' + view.id}>
					            	<button className="btn btn-primary" rel={view.id} 
					            			onClick={thisComponent.handleOpenView}>Open</button>
			            		</a>
					            <hr></hr>
					            <h4>Download Options: </h4>
								<a onClick={thisComponent.handleFileDownload}>
									<Button size="sm" variant="default" rel={view.id}>
								    	<FontAwesomeIcon icon={faFileImage} className="mr-1" rel={view.id}/> PNG
								    </Button>
							    </a>
							    <a onClick={thisComponent.handleFileDownload}>
							    	<Button size="sm" variant="danger" rel={view.id}>
								    	<FontAwesomeIcon icon={faFilePdf} className="mr-1" rel={view.id}/> PDF
								    </Button>
							    </a>
							    <a onClick={thisComponent.handleFileDownload}>
								    <Button size="sm" variant="success" rel={view.id}>
								    	<FontAwesomeIcon icon={faFileExcel} className="mr-1" rel={view.id}/> CSV
								    </Button>
							    </a>
						    </BackSide>
						  </Flippy>
				    </div>
		})

		//	/*{"backgroundImage":"linear-gradient(to right top, #eb8f51, #e5736f, #c8668b, #996399, #646194, #506390, #3f6489, #35637f, #3e6c86, #46758d, #507e94, #59879b)"}*/

		//	Define the next/previous arrow elements
		const nextIcon = <span aria-hidden="true" className="carousel-control-icon-custom"><i className="fas fa-chevron-circle-right fa-5x"></i></span>
		const prevIcon = <span aria-hidden="true" className="carousel-control-icon-custom"><i className="fas fa-chevron-circle-left fa-5x"></i></span>	
		
		//	Main render return
		return (
			 <section className="text-center my-5 " >
			 	<h2 className="h1-responsive font-weight-bold text-center my-5 c-top-view-title">Most Popular Views</h2>
				<Row className="c-top-view-header">
					<Col xs={1} style={{fontSize:'1.5em',textAlign:'right'}}>
				  		<i className="fa fa-filter"></i>
					</Col>
					<Col xs={2} style={filterStyle}>
				  		<h4 style={filterLabelStyle}>Projects:</h4>
					</Col>
					<Col xs={2} style={filterStyle}>
						<Select closeMenuOnSelect={false} components={makeAnimated()} isMulti options={this.props.projects} onChange={this.handleProjectSelections}/>
					</Col>
					<Col xs={2} style={filterStyle}>
				  		<h4 style={filterLabelStyle}>Owner:</h4>
					</Col>
					<Col xs={2} style={filterStyle}>
						<Select closeMenuOnSelect={false} components={makeAnimated()} isMulti options={this.props.owners} onChange={this.handleOwnerSelections}/>
					</Col>
					<Col xs={2} style={filterStyle}>
						<Form size='lg' onChange={this.handleTypeSelections}>
							<Form.Check custom inline defaultChecked={this.state.dashboardsOnly} label="Dashboards Only" type="checkbox" id={dashboardsOnlyId}/>
						</Form>
					</Col>
				  </Row>
				<Row>
					<Carousel wrapAround={true} slidesToShow={this.state.slidesPerPage} slidesToScroll={this.state.slidesPerPage} 
							  pauseOnHover={true} autoplay={true} autoplayInterval={5*1000}
							  framePadding='0em 2em 0em 2em' cellSpacing={40} initialSlideHeight={700} heightMode='first'>
						{ slides }
					</Carousel>
				</Row>
			 </section>
		)
	}
}