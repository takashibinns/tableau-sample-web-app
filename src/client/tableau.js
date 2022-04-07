
/********************************/
//	Tableau Specific Functions 	//
/********************************/

import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-toastify';

/*	

The "settings" object should consist of the following properties:

	'server': Base URL of your Tableau Server,
	'site': Site name (blank for default site),
	'apiVersion': API version number (string)

*/

//	Headers to send on every API call
const headers = {
	'Content-Type':'application/json',
	'Accept':'application/json'
}

//	Define the name of the Tableau auth header
const tokenName = 'X-Tableau-Auth';

//	Function to build the base url
function baseUrl(settings, session){
	return settings.server + '/api/' + settings.apiVersion + '/sites/' + session.site.id;
}

//	Function to handle errors from the Tableau REST API
function errorHandler(response) {
	console.log(response)
	return {
		error: true
	}
} 

//	Function to format dates into a friendly display
export const tabDateFormatter = (dateString) => {
	
	//	Create a moment date object
	var d = new moment(dateString);

	//	return the formatted version of this date
	return d.format("MMM D, YYYY h:mm a")
}

//	Login API call
export const tabLogin = (settings, email, password) => {

	//	Define the login url
	var url = settings.server + '/api/' + settings.apiVersion + '/auth/signin';

	//	Define the payload
	var body = {
		"credentials": {
		    "name": email,
		    "password": password,
		    "site": {
		        "contentUrl": settings.site
		    }
		}
	}

	// Define option
	var options = {
		'method':'POST',
		'headers': headers,
		'data': body,
		'url': url
	}

	//	Make the API call and return the results
	return axios(options).then(response1 => { 
			
		//	Figure out when the api key expires
		var now = (new Date()).getTime()/1000|0,
			expiration = now + (settings.apiTokenExpiration*60);

		var options = {
			'method':'GET',
			'url': '/api/tableau/login?user=' + email
		}

		//	Make one last API call to this web app, in order to get a trusted key (used for SSO)
		return axios(options).then( response3 => {

			//	Return the authentication payload
			return {
				'apiKey': response1.data.credentials.token,
				'apiExpiration': expiration,
				'user': {
					'id': response1.data.credentials.user.id,
					'email': email,
					'name': email,
					'lastLogin': '',
					'role': '',
					'trusted': response3.data.trusted,
				},
				'site': {
					'id': response1.data.credentials.site.id,
					'name': response1.data.credentials.site.contentUrl
				}
			}

		})
		
	}).catch( error => {

		//	Show a login failed popup
		toast.error("Login Failed, please try again.", {
	        position: toast.POSITION.TOP_RIGHT
	    })

		//	Return the error message
		return {
			'error': error.message
		}
	})
}

//	Logout API call
export const tabLogout = (settings,session) => {

	//	Define the login url
	var url = settings.server + '/api/' + settings.apiVersion + '/auth/signout';

	//	Define the headers
	var myHeaders = Object.assign({},headers)
	myHeaders[tokenName] = session.apiKey;

	// Define option
	var options = {
		'method':'POST',
		'headers': myHeaders,
		'data': {},
		'url': url
	}

	//	Make the API call and return the results
	return axios(options).then(response => { 
		return {
			apiKey: null,
			user: {},
			site: {}
		}
	})
}

//	Fetch Tableau trusted ticket from this server
export const tabGetTicket = (trusted) => {

	//	Define the api call url and query parameters
	var url = '/api/tableau/ticket?trusted=' + trusted,
		params = {
			'trusted': trusted
		}

	//	Make the API call
	return axios.get(url).then(response => {
		return {
			'ticket': response.data.ticket
		}
	})
}

//	Fetch Tableau trusted ticket from this server
export const tabGetToken = (trusted) => {

	//	Define the api call url and query parameters
	var url = '/api/tableau/jwt?trusted=' + trusted,
		params = {
			'trusted': trusted
		}

	//	Make the API call
	return axios.get(url).then (response => {
		return {
			'token': response.data.token
		};
	})
}

//	Query for user's views
export const tabGetViews = (settings, session) => {

	//	Define some config for this method
	const config = {
		'fields': 'id,name,contentUrl,updatedAt,usage,sheetType,workbook.id,workbook.name,owner.email,owner.fullName,project.id,project.name,project.description',
		'sortBy': 'hitsTotal:desc',
		'pageSize': 100
	};

	//	Define the URL for getting the first chunk of views
	const viewUrl = baseUrl(settings,session) + '/views?fields=' + config.fields
											+ '&sortBy=' + config.sortBy
											+ '&pageSize=' + config.pageSize
											+ '&pageNumber=1';
	
	//	Define the URL for getting the user's favorite views
	const favoritesUrl = baseUrl(settings,session) + '/favorites/' + session.user.id;

	//	Define the request headers
	let myHeaders = Object.assign({}, headers);
	myHeaders[tokenName] = session.apiKey;

	// Define option
	var options = {
		'method':'GET',
		'headers': myHeaders,
		'url': viewUrl
	}

	//	Create empty array to hold all views
	var myViews = [];

	//	Function to clean up the data from Tableau
	function cleanup(allViews,allFavorites){

		//	Initialize objects for the filter
		var projects = [],
			projectDictionary = {},
			owners = [],
			ownerDictionary = {};

		//	Define a function to sort alphabetically
		function sortAlpha(a, b){
		    if(a.label < b.label) { return -1; }
		    if(a.label > b.label) { return 1; }
		    return 0;
		}

		//////////////////////////////////////////////
		//	Get only the favorite views 			//
		//////////////////////////////////////////////

		//	Create an empty dictionary to hold the favorites
		var favorites = {};

		//	Loop through each favorite
		allFavorites.forEach( fav => {

			//	Check to see if this a view, if so we save to the dictionary
			if (fav.view){
				favorites[fav.view.id] = fav.label;
			}
		})

		//	Loop through each favorite
		allFavorites.forEach( fav => {

			//	Check to see if this a view, if so we save to the dictionary
			if (fav.view){
				favorites[fav.view.id] = fav.label;
			}
		})

		//////////////////////////////////////////////
		//	Loop through all views, and process 	//
		//////////////////////////////////////////////

		//	Loop through each view
		allViews.forEach( view => {

			//	Is this view a favorite?
			view.favorite = favorites[view.id] ? true : false;

			var url = view.contentUrl.split('/');

			//	Build all relevant URLs for this view
			view.links = {
				'png': baseUrl(settings,session) + '/views/' + view.id + '/image',
				'csv': baseUrl(settings,session) + '/views/' + view.id + '/data',
				'thumbnail': baseUrl(settings,session) + '/workbooks/' + view.workbook.id + '/views/' + view.id + '/previewImage',
				'pdf': baseUrl(settings,session) + '/views/' + view.id + '/pdf',
				'embed': '/views/' + url[0] + '/' + url[2],
			} 

			//	Build a placeholder for data
			view.data = {
				'thumbnail':null,
				'csv':null
			}

			//	Have we seen this project yet?
			const projectId = (view.project || {}).id;
			if (!projectId){
				//	This is in a personal space (not a real project)
				return;
			}
			if ( projectId && !projectDictionary[projectId]) {
				//	Nope, mark this project
				projectDictionary[view.project.id] = view.project.name;
				projects.push({ 'value':view.project.id, 'label': view.project.name})
			}

			//	Have we seen this owner yet?
			if (!ownerDictionary[view.owner.email]) {
				//	Nope, mark this owner
				ownerDictionary[view.owner.email] = view.owner.fullName;
				owners.push({ 'value':view.owner.email, 'label': view.owner.fullName })
			}

			//	Does this view belong to the landing page project?
			if (view.project.name === settings.landingPageProject) {
				//	Yes, mark it as a landing page project
				view.onLandingPage = true;
			}
		})

		//	Return the processed views
		return {
			'views': allViews,
			'projects': projects.sort(sortAlpha),
			'owners': owners.sort(sortAlpha)
		}
	}


	//	Make the API call(s) and return the results
	return axios(options).then(response => { 

		//	Figure out how many API calls we need to get, in order to fetch all views
		var totalPages = Math.ceil(response.data.pagination.totalAvailable / 100);

		//	Always store the first set of views
		myViews = response.data.views.view;

		//	Create the API call for getting the user's favorites
		var favOptions = Object.assign({},options);
		favOptions.url = favoritesUrl;
		
		//	Check the response, to see if we need to make additional API calls to get more views
		if (totalPages == 1) {

			//	All views already fetched, return the processed results
			return axios(favOptions).then( response => {
				return cleanup(myViews,response.data.favorites.favorite);
			})

		} else {

			//	Need to make multiple API calls, to fetch all views
			var myPromises = []
			for (var pageNumber=2; pageNumber<=totalPages; pageNumber++){

				//	Create a copy of the old options object
				var pagedOptions = Object.assign({},options)

				//	Change the URL
				pagedOptions.url = baseUrl(settings,session) + '/views?fields=' + config.fields
															+ '&sortBy=' + config.sortBy
															+ '&pageSize=' + config.pageSize
															+ '&pageNumber=' + pageNumber;
				//	Add to promise array
				myPromises.push(axios(pagedOptions))
			}

			return axios.all(myPromises).then( responses => {
				
				//	Loop through all responses, and add in the views
				responses.forEach( response => {

					//	Concatenate the existing views, with this API call's
					myViews = myViews.concat(response.data.views.view);
				})
				
				//	All viewed fetched, return the processed results
				return axios(favOptions).then( response => {
					return cleanup(myViews,response.data.favorites.favorite);
				})
			})

		}
	})
}

//	Function to fetch the thumbnail of a tableau view
export const tabGetViewThumbnails = (setting, session, views) => {

	//	Define the list of URLs for our thumbnails
	var urls = [];
	views.forEach( view => {
		urls.push(view.links.thumbnail);
	});

	//	Define the options for the API call
	var options = { 
		'headers': {}
	}

	//	Add in the tableau api key
	options.headers[tokenName] = session.apiKey;

	//	Define a function to convert the array buffer to a base 64 string
	function arrayBufferToBase64(buffer) {
		var binary = '';
		var bytes = [].slice.call(new Uint8Array(buffer));

		bytes.forEach((b) => binary += String.fromCharCode(b));

		return window.btoa(binary);
	};

	//	Create the array of promises
	return Promise.all(urls.map( url => fetch(url,options))).then(responses =>
	    	Promise.all(responses.map( res => res.arrayBuffer()))
		).then(buffers => {
			
			//	Create an array to hold all the updated views, and loop through each response
			var newViews = [];
			for (var i=0; i<buffers.length; i++){

				//	Get the view ID and thumbnail buffer
				var url = urls[i],
					id = url.split('/views/')[1].split('/')[0],
					buffer = buffers[i];

				//	Create an object for each view, which includes the id and thumbnail data
				newViews.push( {
					id: id,
					thumbnail: 'data:image/png;base64,' + arrayBufferToBase64(buffer)
				})
			}  
	   		
	   		//	return the array of updated views
	   		return newViews;
		})
}

//	Function to download the data of a view
export const tabGetViewData = (session, view, type) => {
	
	//	Define the options for the API call
	var options = { 
		'method': 'GET',
		'responseType': 'blob',
		'headers': {},
	}

	//	Add in the tableau api key
	options.headers[tokenName] = session.apiKey;

	//	Define the message
	var toastMessage = 'Downloading ' + view.name + '.' + type,
		toastOptions = {
			'autoClose': false,
			'type': toast.TYPE.INFO,
		}

	//	Show the download notification
	var toastId = toast(toastMessage,toastOptions);
	
	//	Make the API call
	return axios(view.links[type], options)
		.then(response => {
		
			//Create a Blob from the PDF Stream
		    const file = new Blob(
		      [response.data], 
		      {type: 'application/octet-stream'});
			
			//	Create a download link
		    var downloadLink = document.createElement("a");
			downloadLink.href = URL.createObjectURL(file);
			downloadLink.download = view.name + '.' + type;

			//	click the link to save the file
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);

			//	Remove the download notification
			toast.update(toastId, {
				render: "Download Complete",
				type: toast.TYPE.SUCCESS,
				autoClose: 1000,
				className: 'rotateY animated'
			})
			

			//toast.dismiss(toastId)
			return { complete: true}
		})
		.catch(error => {
		    return { error: true}
	});
}

//	Function to get the usage data from tableau server
export const tabGetUsageData = (session) => {

	//	Define the api call url and query parameters
	var url = '/api/tableau/usage?userId=' + session.user.id;

	//	Make the API call
	return axios.get(url).then(response => {

		//	Organize the raw data, before returning it
		var data = {},
			key;
		for (key in response.data.data) {
	        if (response.data.data.hasOwnProperty(key)) {
	            var dataSet = response.data.data[key];
	            data[dataSet.name] = dataSet.data;
	        }
	    }
		return data;
	})
}
