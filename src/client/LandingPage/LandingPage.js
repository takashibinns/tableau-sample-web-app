import React, { Component } from 'react';
import { Container, Row, Col} from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import { SpringGrid, CSSGrid, measureItems, makeResponsive } from 'react-stonecutter';
import { tabGetViewThumbnails, tabDateFormatter } from '.././tableau';
import LoadingImage from '../../../public/loading-background.svg';
import './LandingPage.css';


const tableauImageClass = "tableau-img";	//	TODO: still hardcoded within className
const dashboardsOnlyId = 'landing-page-dashboard-only-filter';

export default class LandingPage extends Component {

	//	Initialization
	constructor(props){
		super(props);

		//	Define the state of this component
		this.state = {
			tableauSession: this.props.tableauSession,
			landingPageViews: this.props.landingPageViews,
			dashboardsOnly: true
		}

		//	Bind functions to this
		this.handleOpenView = this.handleOpenView.bind(this);
		this.handleTypeSelections = this.handleTypeSelections.bind(this);
	}

	//	Handle when a user clicks on a view to open
	handleOpenView(event) {

		//	Determine the view id
		var viewId = event.target.getAttribute('rel');

		//	Look for the view object
		var view = this.props.landingPageViews.find( view => { return view.id === viewId; })

		//	Notify parent of the view to embed
		this.props.onOpenView(viewId, view.name);
	}

	//	Handle filter changes
	handleTypeSelections(event){
		
		//	Update the state
		this.setState( {
			dashboardsOnly: event.target.checked	
		})
	}

	render() {

		//	Create a refrence to this component
		var thisComponent = this;

		//	Define an array to hold any views we need to update
		var viewsToUpdate = [];

		//	Loop through each view
		this.props.landingPageViews.forEach( view => {

			//	Does this view have a cached thumbnail?
			if (!view.data.thumbnail) {

				//	No it doesn't, add it to the list of views to update
				viewsToUpdate.push(view);
			}
		})

		//	If we have views that need updating, make the API calls to fetch the thumbnails
		if (viewsToUpdate.length > 0) {
			tabGetViewThumbnails( this.props.tableauSettings, this.props.tableauSession, viewsToUpdate)
				.then (newViews => {

				//	Only update if there are views w/ changes
				if (newViews.length > 0) {

					//	pass the new view data up to top level
					thisComponent.props.onViewUpdates(newViews,'thumbnail');
				}
				
			})
		}

		//	Filter the views, based on the user selections (state)
		var landingPageViews = this.props.landingPageViews.filter( view => {

			//	Init variable
			var isValid = true;

			//	Check the dashboard only toggle
			if (thisComponent.state.dashboardsOnly && view.sheetType!=="dashboard") {
				isValid = false;
			}

			//	Return the filter results
			return isValid;
		})

		//	Define the grid
		const Grid = makeResponsive(CSSGrid, {
		  maxWidth: 2800,
		  minPadding: 50
		});

		//	Define the HTML to render for each view
		const clickHandler = this.handleOpenView;
		const views = landingPageViews.map((view, index) => {

			//	Check to see if the thumbnail has been loaded
			var imageUrl = view.data.thumbnail ? view.data.thumbnail : LoadingImage;

			//	Return the image html
			return <li key={index} className='c-landing-page-list'>
						<Container>
							<Row>
						        <a className="nostyle" href={'#view/' + view.id.toLowerCase()} onClick={clickHandler} rel={view.id}>
						        	<img className="c-landing-page-thumbnail rounded z-depth-1" 
						        	 src={imageUrl} rel={view.id}></img>
					        	</a>
						      	<Col>
							        <h4 className="font-weight-bold mb-3 c-landing-page-view-title">
							        	<a className="nostyle" href={'#view/' + view.id.toLowerCase()} onClick={clickHandler} rel={view.id}>{view.name}</a>
						        	</h4>
							        <h6 className="font-weight-bold grey-text mb-3">{view.workbook.name}</h6>
							        <p className="grey-text">{'Last updated by' + view.owner.fullName + ' at ' + tabDateFormatter(view.updatedAt)}</p>
						      	</Col>
					      	</Row>
					    </Container>
				    </li>
		})

		//	Main render return
		return (
			<section className="my-5">
			  <h2 className="h1-responsive font-weight-bold text-center my-5 c-favorites-header">Welcome to {this.props.tableauSettings.appName}</h2>
			  <Container>
			  	<Row>
			  		<Col>
			  			<p className="text-right w-responsive mx-auto mb-5">Below are all the views from the <b>{this.props.tableauSettings.landingPageProject}</b> project on the Tableau Server</p>
		  			</Col>
			  		<Col>
			  			<Form className="c-landing-page-filters" size='lg' onChange={this.handleTypeSelections}>
							<Form.Check custom inline defaultChecked={this.state.dashboardsOnly} label="Dashboards Only" type="checkbox" id={dashboardsOnlyId}/>
						</Form>
			  		</Col>
			  	</Row>
			  </Container>
			  <Grid component="ul" columnWidth={650} gutterWidth={25} itemHeight={275} duration={800}>
			  	{ views }
			  </Grid>
			</section>
		)
	}
}