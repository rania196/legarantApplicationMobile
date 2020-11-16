/**
* @author:		 Frédéric VO
* @date:		 01/11/2020
* @description:	 Connect node.js with Heroku PostgreSQL database which is connect with Salesforce sandbox
*
*/

// Import the express module and create an Express application
var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');
var app = express();

// Setting app : port, express.static, bodyParser
app.set('port', process.env.PORT || 5000);
app.use(express.static('public'));
app.use(bodyParser.json());

// POST on Salesforce DB to get Contact information with contact email and contact password. Returning few informations. Retrieve information in front with route /getContactInfo
app.post('/getContactInfo', function(req, res) {
	//Connect with Heroku PostgreSQL database
	pg.connect(process.env.DATABASE_URL, function (err, conn, done) {
		if (err) console.log(err);
		conn.query(
			'SELECT Id, FirstName, LastName, Email, Contact_Password__c, Phone, MobilePhone, SfId, MailingCity, MailingCountry, MailingPostalCode, MailingState, MailingStreet FROM salesforce.Contact WHERE LOWER(Email) = LOWER($1) AND Contact_Password__c = ($2)',
			[req.body.contactEmail.trim(),
			req.body.contactPassword.trim()],
			function(err, result) {
				done();
				if (err != null || result.rowCount == 0) {
					if (result.rowCount == 0) {
						res.status(403).json({error: 'Contact Email and Contact Password not matching!'});
					} else {
						res.status(400).json({error: err.message});
					}
				}
				else {
					res.json(result);
				}
			}
		);
	});
});

// POST on Salesforce DB to update Contact information with contact FirstName contact LastName and contact Email. Retrieve new information in front with route /updateContactInfo
app.post('/updateContactInfo', function(req, res) {
	//Connect with Heroku PostgreSQL database
	pg.connect(process.env.DATABASE_URL, function (err, conn, done) {
		if (err) console.log(err);
		conn.query(
			'UPDATE salesforce.Contact SET Phone = $1, MobilePhone = $2, MailingCity = $3, MailingCountry = $4, MailingPostalCode = $5, MailingState = $6, MailingStreet = $7 WHERE LOWER(FirstName) = LOWER($8) AND LOWER(LastName) = LOWER($9) AND LOWER(Email) = LOWER($10)',
			[req.body.phone.trim(),
			req.body.mobilePhone.trim(),
			req.body.mailingCity.trim(),
			req.body.mailingCountry.trim(),
			req.body.mailingPostalCode.trim(),
			req.body.mailingState.trim(),
			req.body.mailingStreet.trim(),
			req.body.firstName.trim(),
			req.body.lastName.trim(),
			req.body.email.trim()],
			function(err, result){
				done();
				if (err != null || result.rowCount == 0) {
					if (err) {
						res.status(400).json({error: err.message});
					}
				} else {
					res.json(result);
				}
			});
	});
});

// POST on Salesforce DB to get Contacts Insurance of contact Id. Retrieve new information in front with route /getContactContracts
app.post('/getContactContracts', function(req, res) {
	pg.connect(process.env.DATABASE_URL, function (err, conn, done) {
		//Connect with Heroku PostgreSQL database
		if (err) console.log(err);
		conn.query(
			'SELECT Id, Name, Insurance_product__c FROM salesforce.Insurance_contract__c WHERE LOWER(Contact__c) = LOWER($1)',
			[req.body.contactId.trim()],
			function(err, result) {
				done();
				if (err != null || result.rowCount == 0) {
					if (result.rowCount == 0) {
						res.status(204).json({error: 'No results found'});
					} else {
						res.status(400).json({error: err.message});
					}
				}
				// Retrieve products link with contract
				else {
					result.rows.forEach(function(item, index) {
						conn.query(
							'SELECT Name FROM salesforce.Insurance_product__c WHERE SfId = $1',
							[item.insurance_product__c],
							function(err2, result2) {
								done();
								// Retrieve product name with product id
								if (err2 == null && result2.rowCount != 0) {
									item.insurance_product__c = result2.rows[0].name;
								}
								if (result.rows.length == index + 1) {
									callbackContracts(res, result);
								}
							}
						);
					});
				}
			}
		);
	});
});

// JSON result
function callbackContracts(res, result) {
	res.json(result);
}

// POST on Salesforce DB to get all Insurance products. Retrieve new information in front with route /getAllProducts
app.post('/getAllProducts', function(req, res) {
	pg.connect(process.env.DATABASE_URL, function (err, conn, done) {
		if (err) console.log(err);
		conn.query(
			'SELECT Name FROM salesforce.Insurance_product__c',
			function(err, result) {
				done();
				if (err != null || result.rowCount == 0) {
					if (result.rowCount == 0) {
						res.status(403).json({error: 'No product found'});
					} else {
						res.status(400).json({error: err.message});
					}
				}
				else {
					res.json(result);
				}
			}
		);
	});
});

// Know which port is listened
app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});