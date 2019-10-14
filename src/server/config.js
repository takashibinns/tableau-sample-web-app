
/********************************/
//	Tableau Configuration 		//
/********************************/

'use strict';

const config = {
	//	This section of config settings is shared client side (browser)
	'public': {
		//	What is the URL of your Tableau Server? This should include protocol (http:// or https//) and port (if not 80 or 443)
		'server': 'https://<-your-tableau-server>',
		//	What is the name of the site should we authenticate to?
		'site': '',
		//	What version of the REST API should we use?
		'apiVersion': '3.1',
		//	How many seconds until an authentication token is expired? default setting on TS is 240 minutes
		'apiTokenExpiration': 240,
		//	Should this application provide SSO for embedded views? set to false if you have already setup SSO on your tableau server
		'useTrustedTicketSSO': false,
		//	Title of this web application
		'appName': 'My Healthcare Analytics Hub',
		//	Landing Page project
		'landingPageProject': 'Population Health Analytics',
		//	How long does your Tableau Repository retain data (183 days by default)
		'eventDataDurationLabel' : '6 months'
	},
	//	This section of config settings never leaves the server
	'private': {

		//	Encryption key (server side only, you can change this to any string value)
		'cryptoKey': 'MySecureKey',
		//	Tableau Server Admin Credentials (used to fetch data from published workbooks)
		'adminUser': '<admin username>',
		'adminPassword': '<admin-password>',
		//	Name of the workbook, that contains server data (recently viewed content, peer groups, comments, etc)
		'adminWorkbook':'ServerUsage',
	}
}



module.exports = config;