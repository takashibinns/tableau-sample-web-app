//	Load the config file
const tableauConfig = require('./config.js');

//	require the dependencies
const express = require('express');
const bodyParser = require('body-parser');  
const url = require('url');  
const axios = require('axios');
const querystring = require('querystring');  
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require("crypto-js");
const parse = require('csv-parse/lib/sync');
const os = require('os');

//	Start the express app
const app = express();
app.use(express.static('dist'));
app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());

/*
app.get('/test', (req,res) => {
	var urlParam = req.query.filter ? req.query.filter : 'None provided';
	res.send({
		'timestamp': Date.now(),
		'filter' : urlParam
	})
})
*/

app.get('/api/tableau/jwt', (req, res) => {

	//	Decript the username, using our secure key
	var reb64 = CryptoJS.enc.Hex.parse(req.query.trusted);
	var bytes = reb64.toString(CryptoJS.enc.Base64);
	var decrypt = CryptoJS.AES.decrypt(bytes, tableauConfig.private.cryptoKey);
	var username = decrypt.toString(CryptoJS.enc.Utf8);

	//	Create a JWT token
	let jwtSecretKey = tableauConfig.private.connectedAppSecretValue
	let now = new Date()
	let expirationDate = (now.getTime() / 1000) + (5 * 60)	//	5 minutes from now
	let payload = {
        'iss': tableauConfig.private.connectedAppClientId,	//	Connected App's ID
        'exp': expirationDate,		
		'jti': uuidv4(),			//	Unique identifier for this JWT
		'aud': 'tableau',			//	constant value
		'sub': username,			//	User to authenticate as
		'scp': ['tableau:views:embed', 'tableau:metrics:embed']	//	Scopes
    }
	let options = {
		'header': {
			'kid': tableauConfig.private.connectedAppSecretId,
			'iss': tableauConfig.private.connectedAppClientId,
		},
		'algorithm': 'HS256'
	}
  
    const token = jwt.sign(payload, jwtSecretKey, options);

	res.send({'token':token})
})

//	API endpoint for fetching this app's configuration settings
app.get('/api/tableau/config', (req, res) => res.send( tableauConfig.public ));

//	API endpoint for logging into the tableau server
app.get('/api/tableau/login', (req, res) => {

	//	Encrypt the username using a secure key
	var b64 = CryptoJS.AES.encrypt(req.query.user, tableauConfig.private.cryptoKey).toString();
		e64 = CryptoJS.enc.Base64.parse(b64),
		encryptedUsername = e64.toString(CryptoJS.enc.Hex);

	//	Return the encrypted key
	res.send({'trusted':encryptedUsername});
})

//	API endpoint for getting a trusted ticket
app.get('/api/tableau/ticket', (req, res) => {

	/*	In order to get a trusted ticket from the Tableau server, we need to make an API call */
	//console.log(req.query.toString())
	//	Decript the username, using our secure key
	var reb64 = CryptoJS.enc.Hex.parse(req.query.trusted);
	var bytes = reb64.toString(CryptoJS.enc.Base64);
	var decrypt = CryptoJS.AES.decrypt(bytes, tableauConfig.private.cryptoKey);
	var username = decrypt.toString(CryptoJS.enc.Utf8);
	
	//	Define the login payload
	const payload = {
		'username': username,
		'target_site': tableauConfig.public.site,
	}
	
	//	Define the api call's configuration
	const options = {
		'method': 'POST',
		'url': tableauConfig.public.server + '/trusted',
		'headers': {
			'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
			'Accept':'application/json'
		},
		'data': querystring.stringify(payload)
	}

	//	Make the api call to tableau server
	axios(options).then( response => {
		//console.log('Issuing ticket: ' + response.data);
		res.send({'ticket':response.data})
	}).catch( error => {
			res.send({
				'error': true,
				'message': 'Error getting trusted ticket from Tableau Server',
				'details': error
			})
		})
})

//	API endpoint for getting usage data on the server
app.get('/api/tableau/usage', (req, res) => {

	//	Get the user id from the request
	const userIdFilter = req.query.userId;

	//	Define the url to login as the admin
	const authUrl = tableauConfig.public.server + '/api/' + tableauConfig.public.apiVersion + '/auth/signin';

	//	Define the api call's configuration
	const options = {
		'method': 'POST',
		'url': authUrl,
		'headers': {
			'Content-Type':'application/json',
			'Accept':'application/json'
		},
		'data': {
			'credentials': {
				'name': tableauConfig.private.adminUser,
				'password': tableauConfig.private.adminPassword,
				'site': {
					'contentUrl': tableauConfig.public.site
				}
			}
		}
	}

	//	Make the API call to login as the admin user
	axios(options).then( authResponse => {

		//	Get the api token and site id
		const token = authResponse.data.credentials.token,
			siteId = authResponse.data.credentials.site.id;

		//	Define the url for getting the workbook
		const workbookUrl = tableauConfig.public.server + '/api/' + tableauConfig.public.apiVersion 
							+ '/sites/' + siteId + '/workbooks?fields=id&filter=name:eq:' + tableauConfig.private.adminWorkbook;

		//	Define the api call's configuration
		const workbookOptions = {
			'method': 'GET',
			'url': workbookUrl,
			'headers': {
				'Content-Type':'application/json',
				'Accept':'application/json',
				'X-Tableau-Auth': token,
			}
		}

		//	Make the API call to get the admin workbook's info
		axios(workbookOptions).then( workbookResponse => {

			//	Get the workbook id
			const workbookId = workbookResponse.data.workbooks.workbook.length > 0 ? workbookResponse.data.workbooks.workbook[0].id : '';

			//	Define the url for getting the workbook
			const viewsUrl = tableauConfig.public.server + '/api/' + tableauConfig.public.apiVersion 
								+ '/sites/' + siteId + '/workbooks/' + workbookId
								+ '/views?fields=id,name';

			//	Define the api call's configuration
			const viewsOptions = {
				'method': 'GET',
				'url': viewsUrl,
				'headers': {
					'Content-Type':'application/json',
					'Accept':'application/json',
					'X-Tableau-Auth': token,
				}
			}
			
			//	Make the api call to get the admin views
			axios(viewsOptions).then( viewsResponse => {

				//	Now we have a list of all views in the admin workbook,
				//	we need to loop through this list and make an api call
				//	to fetch the data for each view
				

				//	Define the base object for all api calls
				const baseOptions = {
					'method': 'GET',
					'headers': {
						'Content-Type':'application/json',
						'Accept':'application/json',
						'X-Tableau-Auth': token,
					}
				}

				//	Define dictionary to hold the usage data
				var usageData = {};

				//	Loop through each view in the workbook, and create the options object
				var views = [];
				viewsResponse.data.views.view.forEach( view => {

					//	Construct the url to fetch data for this view (including user & site filters)
					const dataUrl = tableauConfig.public.server + '/api/' + tableauConfig.public.apiVersion 
								+ '/sites/' + siteId + '/views/' + view.id
								+ '/data?vf_UserId=' + userIdFilter + '&vf_SiteId=' + siteId;

					
					//	Create the request object
					var dataOption = Object.assign({},baseOptions);
					dataOption.url = dataUrl;
					dataOption.headers['viewId'] = view.id;

					//	Save a reference to this view in the usage data dictionary
					usageData[view.id] = {
						'name': view.name
					}

					//	Add the API call promise to the array
					views.push(axios(dataOption))
				})

				//	Execute API calls for all sheets
				axios.all(views).then( responses => {

					
					//	Loop through all responses, and add in each view's data
					responses.forEach( response => {

						//	What view is this for?
						const viewId = response.config.headers['viewId'];

						//	Define parsing options
						const parseOptions = {
							columns: true,
							skip_empty_lines: true
						}

						//	Parse the CSV response
						if (usageData[viewId]){
							usageData[viewId]['data'] = parse(response.data,parseOptions)
						}
					})

					//	Return the complete data object
					res.send({
						'data': usageData
					})
				}).catch( error => {
					res.send({
						'error': true,
						'message': 'Error getting the data for the usage views',
						'details': error
					})
				})
			}).catch( error => {
				res.send({
					'error': true,
					'message': 'Error getting the views of the server usage workbook',
					'details': error
				})
			})
		}).catch( error => {
			res.send({
				'error': true,
				'message': 'Error getting the server usage workbook',
				'details': error
			})
		})
	}).catch( error => {
		res.send({
			'error': true,
			'message': 'Error authenticating with admin credentials',
			'details': error
		})
	})
})

//	Start the application, and listen on a given port
app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
