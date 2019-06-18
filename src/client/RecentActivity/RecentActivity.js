//	Import dependencies
import React, { Component } from 'react';
import { Container, Row, Col, Button} from 'react-bootstrap';
import {Timeline, TimelineBlip, TimelineEvent} from 'react-event-timeline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCommentDots, faChartLine } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios';
import { tabGetUsageData } from '.././tableau';
import './RecentActivity.css';

//	Define constants for this component
const headerDivId = 'c-activity-title';
const loadingImage = "/public/loading.svg";

//	Function to check and see if an object is empty
function objectIsEmpty(obj){
	return Object.entries(obj).length === 0 && obj.constructor === Object
}
//	Define the TopViews component
export default class RecentActivity extends Component {

	//	Initialization
	constructor(props){
		super(props);

		//	Define the state of this component
		this.state = {
			tableauSession: this.props.tableauSession,
			tableauSettings: this.props.tableauSettings,
			usagedata: this.props.usagedata,
			allViews: this.props.allViews,
			height: 500,
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
		this.handleOpenView = this.handleOpenView.bind(this);
		//this.updateContainerHeight = this.updateContainerHeight.bind(this);
	}
	
	//	Handle when a user clicks on a view to open
	handleOpenView(event) {
		
		//	Only run if a user clicked on a view node
		var viewId = event.target.getAttribute('rel');

		//	Notify parent of the view to embed
		this.props.onOpenView(viewId.toLowerCase());
		
	}
	
	//	Render the component
	render() {

		//	Save a reference to this component
		var thisComponent = this;

		//	Initialize a variable for the data
		var data = {};
		
		//	Has the usage data finished loading?
		const dataComplete = !objectIsEmpty(this.props.usagedata)
		if (dataComplete) {

			//	Define a function to sort the activity in descending order
			const comparison = (a,b) => {
				if (a.Date > b.Date) {
					return -1
				} else if (a.Date < b.Date) {
					return 1;
				} else {
					return 0
				}
			} 

			//	Get the raw data, TODO: SORT BY DATE
			data.comments = this.props.usagedata['comments'].sort(comparison);
			data.activity = this.props.usagedata['recent-activity'].sort(comparison);
		}

		//	Define a function for building the recent activity's html
		const activity = (data) => {

			//	Create an event for each recent activity
			var events = data.map((data,key) => {

				//	Define the event's title
				const eventTitle = <span className="c-recent-activity-blip" key={key}>Viewed 
										<a href={'#view/' + data.ViewId.toLowerCase()} rel={data.ViewId} onClick={thisComponent.handleOpenView}>
											{" " + data.ViewName}
										</a> on {data.Date}</span>

				//	Define the event details
				return <TimelineBlip title={eventTitle} key={key}
			                         icon={<FontAwesomeIcon icon={faChartLine} className="mr-1"/>}
			            >
			            </TimelineBlip>
			})

			//	Return the full timeline
			return <Timeline orientation="left">
			       	 { events }     
			       </Timeline>
		}

		//	Define a function for building the comment activity's html
		const comments = (data) => {

			//	Create an event for each comment
			var events = data.map((data,key) => {

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

			//	Return the full timeline
			return <Timeline orientation="left">
			       	 { events }     
			       </Timeline>
		}

		//	Decide what content to display
		var content;
		if (dataComplete) {
			content= <Container>
				<Row>
					<Col> 
						<h4 className="h1-responsive font-weight-bold text-center c-recent-activity-title">Recently Viewed</h4>
						{activity(data.activity)} 
					</Col>
					<Col> 
						<h4 className="h1-responsive font-weight-bold text-center c-recent-activity-title">Recent Comments</h4>
						{comments(data.comments)} 
					</Col>
				</Row>
			</Container>
		} else {

			//	Show a loading window
			content = <img src={loadingImage} className="c-activity-loading"></img>	
		}

		//	Main render return
		return (
			 <section className="text-center my-5 " >
				<Row className='c-activity-container'>
					{content}
				</Row>
			 </section>
		)
	}
}