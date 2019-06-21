//	Import Dependencies
import React, { Component } from 'react';
import './ViewDenied.css';

export default class ViewDenied extends Component {

	//	Initialization
	constructor(props){
		super(props);
	}

	//	Render the placeholder HTML for this viz
	render() {
		//	Only renter if there was an error loading the embedded viz
		if (this.props.error) {
			return  <section className="my-5">
						<h2 className="h1-responsive font-weight-bold text-center c-view-header">Access Denied</h2>
						<p className="text-center w-responsive mx-auto mb-5">You are not allowed to see this view, please contact your administrator to get access.</p>
					    <div className='c-denied-hover'>
						  <div className='c-denied-background'>
						    <div className='c-denied-door'>Tableau</div>
						    <div className='c-denied-rug'></div>
						  </div>
						  <div className='c-denied-foreground'>
						    <div className='c-denied-bouncer'>
						      <div className='c-denied-head'>
						        <div className='c-denied-neck'></div>
						        <div className='c-denied-eye c-denied-left'></div>
						        <div className='c-denied-eye c-denied-right'></div>
						        <div className='ear'></div>
						      </div>
						      <div className='c-denied-body'></div>
						      <div className='c-denied-arm'></div>
						    </div>
						    <div className='c-denied-poles'>
						      <div className='c-denied-pole c-denied-left'></div>
						      <div className='c-denied-pole c-denied-right'></div>
						      <div className='c-denied-rope'></div>
						    </div>
						  </div>
						</div>
					</section>
		} else {
			return null
		}
		
	}
}