import React, { Component } from 'react';
import axios from 'axios';
import { tabGetViewThumbnails, tabDateFormatter } from '.././tableau';
import './Favorites.css';

const loadingImage = "/public/loading.gif";
const tableauImageClass = "tableau-img";	//	TODO: still hardcoded within className

export default class Favorites extends Component {

	//	Initialization
	constructor(props){
		super(props);

		//	Define the state of this component
		this.state = {
			tableauSession: this.props.tableauSession,
			favorites: this.props.favorites
		}

		//	Bind functions to this
		this.handleOpenView = this.handleOpenView.bind(this);
	}

	//	Handle when a user clicks on a view to open
	handleOpenView(event) {

		//	Determine the view id
		var viewId = event.target.getAttribute('rel');

		//	Notify parent of the view to embed
		this.props.onOpenView(viewId);
	}

	render() {

		//	Create a refrence to this component
		var thisComponent = this;

		//	Define an array to hold any views we need to update
		var viewsToUpdate = [];

		//	Loop through each view
		this.props.favorites.forEach( fav => {

			//	Does this view have a cached thumbnail?
			if (!fav.data.thumbnail) {

				//	No it doesn't, add it to the list of views to update
				viewsToUpdate.push(fav);
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

		//	Function to build HTML for the view's thumbnail
		function thumbnail(view,index,clickHandler){

			//	Decide what image to use for the given view
			var initialImage = view.data.thumbnail ? view.data.thumbnail : loadingImage;

			return <div className="col-lg-5">
				      <div className="view overlay rounded z-depth-2 mb-lg-0 mb-4 c-favorites-thumbnail">
				        <img className="img-fluid tableau-img"  src={initialImage} rel={view.id} alt="View Thumbnail"></img>
				        <a href={'#view/' + view.id} onClick={clickHandler}>
				          <div className="mask rgba-white-slight" rel={view.id}></div>
				        </a>
				      </div>
				    </div>
		}

		//	Function to build HTML for the view's description
		function desc(view,index,clickHandler){
			return <div className="col-lg-7">
				      <h6 className="font-weight-bold mb-3 green-text"><i className="fas fa-book pr-2"></i>{view.workbook.name}</h6>
				      <h3 className="font-weight-bold mb-3"><strong>{view.name}</strong></h3>
				      <p>This view is found in the {view.workbook.name} workbook, located in the {view.project.name} project.</p>
				      <p><strong>{view.project.name}</strong>: {view.project.description}</p>
				      <p>Created by <a><strong>{view.owner.fullName}</strong></a>, last updated { tabDateFormatter(view.updatedAt) }</p>
				      <a className="btn btn-success btn-md" rel={view.id} href={'#view/' + view.id} onClick={clickHandler}>Open</a>
				    </div>
		}

		//	Function to decide which content goes on the left side (every other view)
		function left(view,index,clickHandler){
			if (index % 2) {
				return thumbnail(view,index,clickHandler)
			} else {
				return desc(view,index,clickHandler)
			}
		}

		//	Function to decide which content goes on the right side (every other view)
		function right(view,index,clickHandler){
			if (index % 2) {
				return desc(view,index,clickHandler)
			} else {
				return thumbnail(view,index,clickHandler)
			}
		}

		//	Define the HTML to render for each view
		const clickHandler = this.handleOpenView;
		const views = this.props.favorites.map((view, index) => {
			return <div key={index}>
				<div className="row">
				    {left(view,index,clickHandler)}
				    {right(view,index,clickHandler)}
				 </div>
				 <hr className="my-5"></hr>
			 </div>
		})

		//	Main render return
		return (
			<section className="my-5">
			  <h2 className="h1-responsive font-weight-bold text-center my-5 c-favorites-header">Favorite Views</h2>
			  <p className="text-center w-responsive mx-auto mb-5">This page shows all views you've marked as <i>Favorites</i> from Tableau Server</p>
			  {views}
			</section>
		)
	}
}