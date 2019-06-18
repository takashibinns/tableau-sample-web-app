//	Import dependencies
import React, { Component } from 'react';
import { tabGetViews } from '.././tableau';
import './Private.css';

//	Import Components
import Favorites from '.././Favorites/Favorites';
import LandingPage from '.././LandingPage/LandingPage';
import TopViews from '.././TopViews/TopViews';
import PeerUsage from '.././PeerUsage/PeerUsage';
import RecentActivity from '.././RecentActivity/RecentActivity';
import View from '.././View/View';

//	Define the Private component
export default class Private extends Component {

	//	Initialization
	constructor(props){
		super(props);

		//	Define the state of this component
		this.state = {
			tableauSession: this.props.tableauSession,
			tableauSettings: this.props.tableauSettings,
			activePage: this.props.activePage,
			embeddedViewId: this.props.embeddedViewId,
			embeddedView: null,
			views: [],
			projects: [],
			owners: [],
			landingPageViews: [],
			favorites: [],
			usageData: {},
		}

		//	Bind several functions to this component
		this.handleViewUpdates = this.handleViewUpdates.bind(this);
		this.handleOpenView = this.handleOpenView.bind(this);
		this.handleUsageUpdate = this.handleUsageUpdate.bind(this);

		//	Get the list of Tableau views, when this component is being rendered
		this.tableauViews();
	}

	//	User clicked a button to open a view, set the state
	handleOpenView(viewId) {

		//	Check to make sure this view exists (and this user has access to it)
		var embedView = this.state.views.find( view => { return view.id===viewId; });
		if (embedView) {
			//	It exists, update the state
			this.props.onPageChange('view',embedView.id)
			this.setState({'embeddedView': embedView})
		} else {
			//	Display error message
			console.log('Error: View ' + viewId + ' not found.')
		}
	}

	//	1+ views were updated with additional information, update the state
	handleViewUpdates(updatedViews,dataProperty) {
		
		//	Create a new array to hold the views
		var newViews = [];

		//	Loop through the existing view
		this.state.views.forEach( view => {

			//	Look for an update for this view
			var updatedView = updatedViews.find( v => v.id === view.id );
			if (updatedView) {
				view.data[dataProperty] = updatedView[dataProperty]
			}

			//	Always add the view to the new array
			newViews.push(view);
		})

		//	Update the state
		this.setState({
			'views': newViews,
			'favorites': newViews.filter ( view => { return view.favorite; }),
			'embeddedView': newViews.find( view => { return view.id === this.state.embeddedViewId; }),
		})
	}

	//	Tableau Server usage data was fetched 
	handleUsageUpdate(usageData) {

		//	Update the state
		this.setState({
			'usageData': usageData,
		})
	}

	//	Get the list of favorite items from Tableau Server
	tableauViews() {

		//	Save a reference to this component
		var thisComponent = this;

		//	Make the API call to login to Tableau Server
		tabGetViews(this.props.tableauSettings, this.props.tableauSession).then( response => {
				
				if (response.error) {
					console.log('Login Error')
				} else {

					//	Update the local state, with the list of all and favorite views
					thisComponent.setState({
						'views': response.views,
						'projects': response.projects,
						'owners': response.owners,
						'landingPageViews': response.views.filter( view => { return view.onLandingPage; }),
						'favorites': response.views.filter( view => { return view.favorite; }),
						'embeddedView': response.views.find( view => { return view.id === thisComponent.state.embeddedViewId; }),
					})
					
				}	
		})
	}

	//	Render the component's HTML
	render() {

		//	Define what content to display, based on the navigation
		var page;
		switch (this.props.activePage) {
			case 'landing-page':
				page = <LandingPage tableauSession={this.state.tableauSession} tableauSettings={this.state.tableauSettings} 
								  landingPageViews={this.state.landingPageViews}  
								  onViewUpdates={this.handleViewUpdates} onOpenView={this.handleOpenView}>
					   </LandingPage>
				break;
			case 'favorites':
				page = <Favorites tableauSession={this.state.tableauSession} tableauSettings={this.state.tableauSettings} 
								  favorites={this.state.favorites} projects={this.state.projects} owners={this.state.owners} 
								  onViewUpdates={this.handleViewUpdates} onOpenView={this.handleOpenView}>
					   </Favorites>
				break;
			case 'most-popular':
				page = <TopViews tableauSession={this.state.tableauSession} tableauSettings={this.state.tableauSettings} 
								 allViews={this.state.views} projects={this.state.projects} owners={this.state.owners}
								 onViewUpdates={this.handleViewUpdates}  onOpenView={this.handleOpenView}>
					   </TopViews>
				break;
			case 'peers':
				page = <PeerUsage tableauSession={this.state.tableauSession} tableauSettings={this.state.tableauSettings} 
								 allViews={this.state.views} usagedata={this.state.usageData}
								 onUsageUpdated={this.handleUsageUpdate}  onOpenView={this.handleOpenView}>
					   </PeerUsage>
				break;
			case 'recent-activity':
				page = <RecentActivity tableauSession={this.state.tableauSession} tableauSettings={this.state.tableauSettings} 
								 allViews={this.state.views} usagedata={this.state.usageData}
								 onUsageUpdated={this.handleUsageUpdate}  onOpenView={this.handleOpenView}>
					   </RecentActivity>
				break;
			case 'view':
				page = <View tableauSession={this.state.tableauSession} tableauSettings={this.state.tableauSettings}
							view={this.state.embeddedView} tableauJs={this.props.tableauJs}>
					   </View>
				break;
		}
		
		//	Render via HTML
		return (
			<main className="c-private">
			    { page }
			</main>
		)
	}
}
