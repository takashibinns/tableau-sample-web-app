//	Import dependencies
import React, { Component } from 'react';
import { Row, Col, Button} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileImage, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios';
import { ResponsiveSankey } from '@nivo/sankey'
import { tabGetUsageData } from '.././tableau';
import LoadingImage from '../../../public/loading.svg';
import './PeerUsage.css';

//	Define constants for this component
const headerDivId = 'c-peer-title';

//	Function to check and see if an object is empty
function objectIsEmpty(obj){
	return Object.entries(obj).length === 0 && obj.constructor === Object
}
//	Define the TopViews component
export default class PeerUsage extends Component {

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
		this.updateContainerHeight = this.updateContainerHeight.bind(this);
	}
	
	//	Handle when a user clicks on a view to open
	handleOpenView(event) {
		
		//	Only run if a user clicked on a view node
		if (event.type =="view") {

			//	Set the url, so people can bookmark
			window.location.hash = "#view/" + event.id.toLowerCase();

			//	Notify parent of the view to embed
			this.props.onOpenView(event.id.toLowerCase(), event.label);
		}
	}

	
	//	Add window listener, to detect browser size changes
	componentDidMount() {
	  this.updateContainerHeight();
	  window.addEventListener('resize', this.updateContainerHeight);
	}

	//	Remove window listener, when leaving this view
	componentWillUnmount() {
	  window.removeEventListener('resize', this.updateContainerHeight);
	}

	//	The sankey diagram needs a set height, so calculcate this based on the user's browser window
	updateContainerHeight() {

		//	Find the rendered header element
		var pageTitle = document.getElementById(headerDivId);

		//	Height of the entire window - (height of page title + margin height)
		var calculatedHeight = window.innerHeight - ( pageTitle.clientHeight + 48+48 + 65);

		//	Update the state, to rerender the sankey to fit the whole page
		this.setState({
			height: calculatedHeight
		})
	}
	
	//	Render the component
	render() {

		//	Save a reference to this component
		var thisComponent = this;

		//	Create a placeholder object for the usage data
		var data = {
			'nodes': [],
			'links': []
		};
		
		//	Has the usage data finished loading?
		const dataComplete = !objectIsEmpty(this.props.usagedata)
		if (dataComplete) {

			//	Get the raw peer activity data
			var rawData = this.props.usagedata['peer-activity'];

			//	Define dictionaries for both the peer user and views
			var peerUsers = {},
				views = {},
				relationships = {};

			//	Start with the logged in user
			const currentUser = this.props.tableauSession.user;

			//	Create a node for this user
			data.nodes.push({
				"id": currentUser.id.toUpperCase(),
				//"id": currentUser.email,
				"label": currentUser.email
			})

			//	Also save the current user to the users dictionary (just in case)
			peerUsers[currentUser.id] = currentUser.id.toUpperCase();


			//	Loop through the usage data, and convert the usage data into the format needed by sankey
			rawData.forEach( point => {

				//	Has this user already been added?
				if (!peerUsers.hasOwnProperty(point.peerUserId)) {

					//	No, save to the dictionary 
					peerUsers[point.peerUserId] = {
						"name": point.peerUser
					}

					//	and add a node
					data.nodes.push({
						"id": point.peerUserId,
						"label": point.peerUser
					})
				}

				//	Has this view already been added?
				if (!views.hasOwnProperty(point.ViewId)) {

					//	No, save to the dictionary 
					views[point.ViewId] = {
						"name": point.ViewName
					}

					//	and add a node
					data.nodes.push({
						"id": point.ViewId,
						"label": point.ViewName,
						"type": "view"
					})
				}

				//	Has the current-peer link already been created?
				var relId = currentUser.id.toUpperCase() + '@to@' + point.peerUserId;
				if (!relationships.hasOwnProperty(relId)) {

					//	No, save to the dictionary 
					relationships[relId] = {
						"from": currentUser.id.toUpperCase(),
						"to": point.peerUserId
					}

					//	Create a link between the current user and the peer user
					data.links.push({
						"source": currentUser.id.toUpperCase(),
						"target": point.peerUserId,
						"value": parseInt(point.peerViewCount)
					})
				}

				//	Has the peer-view link already been created?
				relId = point.peerUserId + '@to@' + point.ViewId;
				if (!relationships.hasOwnProperty(relId)) {

					//	No, save to the dictionary 
					relationships[relId] = {
						"from": point.peerUserId,
						"to": point.ViewId
					}

					//	Create a link between the peer user and the view
					data.links.push({
						"source": point.peerUserId,
						"target": point.ViewId,
						"value": parseInt(point.peerViewCount)
					})	
				}			
			})
		}

		//	Define the custom label formatter
		const customLabel = (node) => {
			return node.label;
		} 

		//	Define the custom tooltip function
		const customTooltip = (node) => {
			if (node.target.type === 'view') {
				return <span><strong style={{'color':node.source.color}}>{node.source.label}</strong> viewed the <strong style={{'color':node.target.color}}>{node.target.label}</strong> view <strong>{node.value}</strong> times within the last {thisComponent.state.tableauSettings.eventDataDurationLabel}</span>
			} else {
				return <span>{node.source.label} > {node.target.label} </span>
			}
		}

		//	Decide what content to display
		var content;
		if (dataComplete) {
			content= <ResponsiveSankey
				        data={data}
				        margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
				        align="justify"
				        colors={{ scheme: 'category10' }}
				        onClick={this.handleOpenView}
				        nodeOpacity={1}
				        nodeThickness={18}
				        nodeInnerPadding={3}
				        nodeSpacing={24}
				        nodeBorderWidth={0}
				        nodeBorderColor={{ from: 'color', modifiers: [ [ 'darker', 0.8 ] ] }}
				        linkOpacity={0.5}
				        linkHoverOthersOpacity={0.1}
				        enableLinkGradient={true}
				        label={customLabel}
				        linkTooltip={customTooltip}
				        labelPosition="inside"
				        labelOrientation="horizontal"
				        labelPadding={16}
				        labelTextColor={{ from: 'color', modifiers: [ [ 'darker', 2 ] ] }}
				        animate={true}
				        motionStiffness={140}
				        motionDamping={13}
				        
				    />
		} else {

			//	Show a loading window
			content = <img src={LoadingImage} className="c-peers-loading"></img>	
		}

		//	Main render return
		return (
			 <section className="text-center my-5 " >
			 	<h2 id={headerDivId} className="h1-responsive font-weight-bold text-center my-5">What content are other people viewing?</h2>
			 	<p className="text-center w-responsive mx-auto mb-5">
			 		This page shows the most commonly accessed dashboards from people in the same group as you.  
			 		Hover over the line between a person and a dashboard, to see how often that view was opened in the last {this.state.tableauSettings.eventDataDurationLabel}.
			 		You can also click on a dashboard, to open it.
		 		</p>
				<Row style={{'height':this.state.height}} className='c-peers-container'>
					{content}
				</Row>
			 </section>
		)
	}
}