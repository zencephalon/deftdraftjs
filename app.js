
/**
 * Module dependencies.
 */
var express = require('express');
var connect = require('connect');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var jade = require('jade');
var stylus = require('stylus');
var markdown = require('markdown').markdown;
var mongoose = require('mongoose');
var models = require('./models');
var app = express();
var mongoStore = require('connect-mongodb');

// all environments
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.cookieParser());
app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecretapp' })  );
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')))
app.get('/*', function(req, res, next){ 
  res.setHeader('Last-Modified', (new Date()).toUTCString());
  next(); 
});
app.use(function(req, res, next){
  res.render('404', { status: 404, url: req.url });
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/deftdraftjs');
  app.use(express.errorHandler({ dumpExceptions: true }));
  app.set('view options', {
    pretty: true
  });
});

models.defineModels(mongoose, function() {
  app.User = User = mongoose.model('User');
  app.Document = Document = mongoose.model('Document');
  app.LoginToken = LoginToken = mongoose.model('LoginToken');
  db = mongoose.connect(app.set('db-uri'));
});

function authenticateFromLoginToken(req, res, next){
	var cookie = JSON.parse(req.cookies.logintoken);

	LoginToken.findOne({	email: cookie.email,
							series: cookie.series,
							token: cookie.token }, (function(err, token){
		if (!token){
			res.redirect('/login');
			return;
		}
		
		User.findOne({ email: token.email }, function(err, user){
			if (user){
				req.session.user_id = user.id;
				req.currentUser = user;

				token.token = token.randomToken();
				token.save(function() {
			        res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
			        next();
	        	});
			} else 
				res.redirect('/login');
			});
	}));
}

function loadUser(req, res, next){
	//authenticate user
	if (req.session.user_id){
		User.findById(req.session.user_id, function(err, user){
			if (user){
				req.currentUser = user;
				next();
			}
			else
				res.redirect('/login');
		});	
	}
	else if (req.cookies.logintoken)
		authenticateFromLoginToken(req, res, next);
	else
		res.redirect('/login');
}

app.get('/', function(req, res){
	res.redirect('/home');
});
app.get('/home', loadUser, function(req, res){

    var callback = function(){
    	if( typeof callback.count == 'undefined' )
        	callback.count = 0;
    	callback.count++;
		if (callback.count == documents.length || documents.length == 0){
			console.log( d_ids, d_title);
		    res.render('index.jade', {
		      locals: { title: 'Home', message: req.session.messages, d_ids: d_ids, currentUser: req.currentUser.name, d_title: d_title }
		    });
		}		
	}
	console.log(req.currentUser);

    documents = req.currentUser.documents;
	console.log("documents", documents);
	d_title = [];
	d_ids = [];
	for (i = 0; i < documents.length; i++ ){
		//find corresponding group _ids in Document Schema
		Document.findOne({ _id: documents[i] }, function(err, doc){
			console.log("doc", doc);
			d_ids = d_ids.concat( doc._id );
			d_title = d_title.concat( doc.title )
		}).exec(callback);
	}
	if (documents.length == 0){
		d_ids = null;
		callback();
	}
});

app.get('/document/:d_id', loadUser, function(req, res){
	//show group bills
	console.log("WTFFFF");
	//res.send('user' + req.params.id);
	var d_title;
	var callback = function(){
		console.log("document title", d_title);
		//get all the bills
		console.log(d_title);
		res.render('document.jade',{
			locals: { title: d_title }
		});
	}
	var d_id = req.url.split('/')[2];
	
	var pagetitle = Document.findOne({ _id: d_id }, function(err, doc){
		console.log("doc._id", doc._id);
		d_title = doc.title;
	}).exec(callback);
	
});

app.get('/logout', function(req, res){
	req.session.destroy();
	res.clearCookie('logintoken');
	res.redirect('/');
});

app.get('/home/documents/:d_id/edit', loadUser, function(){
	//edit some bill
});

app.put('/home/documents/:d_id/edit', loadUser, function(){
	//edit some bill
});

app.del('/home/documents/:d_id/', loadUser, function(){
	// delete some bill
});

app.get('/login', function(req, res){
	res.render('login.jade', {
    	locals: { title: 'Login', users: new User(), message: req.session.messages }
  });
});

app.post('/login', function(req, res){
	console.log(req.body);
	User.findOne({ email: req.body.user.email }, function(err, user){	//find if user exists
		if ( user && user.authenticate(req.body.user.password) ){		//authenticate the password
			req.session.user_id = user.id;
			if (req.body.remember_me ){
				var loginToken = new LoginToken( {email: user.email} );
				req.session.messages = [req.body.user.name];
				loginToken.save(function() {
		        res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
		        res.redirect('/home');
				});
			} else{
				console.log("User logged in: ", user.name );
				req.session.messages = [user.name];
				res.redirect('/home');
			}
		} else {
			req.session.messages = ['Incorrect email or password'];
			res.redirect('/login');
		}
	});
});

app.get('/register', routes.register );

app.post('/register', function(req, res){
	var user = new User(req.body.user);

	function userSaveFail(){
		res.render('register.jade', {
			locals: {user: user, message: "Registration failed" }
		});
	}

	console.log(user.email);
	var name = user.name;
	var email = user.email;

	user.save(function(err){
		if (err)	return userSaveFail();
		req.session.messages = [ req.body.user.name  , ' your account has been created'];
		console.log( req.body.user.name  ,"Account created");
		req.session.user_id = user.id;
		/////console.log

		// send registration email

		var path           = require('path')
		  , templatesDir   = path.resolve('welcome', '..', 'templates')
		  , emailTemplates = require('email-templates')
		  , nodemailer     = require('nodemailer');

		emailTemplates(templatesDir, function(err, template) {

		  if (err) {
		    console.log(err);
		  } else {

		    // ## Send a single email

		    // Prepare nodemailer transport object
		    var transport = nodemailer.createTransport("SMTP", {
		      service: "Gmail",
		      auth: {
		        user: "deftdraft@gmail.com",
		        pass: "ddpassword"
		      }
		    });

		    // An example users object with formatted email function
		    var locals = {
		      email: email,
		      name: {
		        first: 'Mamma',
		        last: 'Mia'
		      }
		    };

		    // Send a single email
		    template('welcome', locals, function(err, html, text) {
		      if (err) {
		        console.log(err);
		      } else {
		        transport.sendMail({
		          from: 'Deft Draft <deftdraft+noreply@gmail.com>',
		          to: locals.email,
		          subject: 'Welcome to Deft Draft!',
		          html: html,
		          // generateTextFromHTML: true,
		          text: text
		        }, function(err, responseStatus) {
		          if (err) {
		            console.log(err);
		          } else {
		            console.log(responseStatus.message);
		          }
		        });
		      }
		    });
		 }
		});

		res.redirect('/home');
	});
});

app.get('/newdocument', loadUser, function(req, res){
	console.log(req.currentUser);
	res.render('newDocument.jade',{
		locals: { title: 'New Document', currentUser: req.currentUser.name }
	});
});

app.post('/newdocument', loadUser, function(req, res){
	console.log( "req.body.doc.title", req.body["doc"] );

	var doc = new Document(req.body["doc"]);
	doc["members"] = doc["members"].concat(req.currentUser.email);
	//doc["title"]  = req.body.doc["title"];
	//doc["content"] = req.body.doc["content"];

	//add this document to each user
	console.log("WTTTTTTTTTTTTFFFF");
	//save the document
	doc.save();		//save the group
	console.log("doc", doc);
	//add this document to each user schema
	for(var i = 0; i < doc["members"].length; i++) {
	    var obj = doc["members"][i];
	    console.log(obj);

	    User.findOne({ email: obj }, function(err, user){
	    	if ( user ){
	    		var prev_docs = user["documents"];
	    		var d_name = doc["title"];
	    		var doc_id = doc["_id"];
	    		var update = { 'documents': prev_docs.concat(doc_id) };
	    		User.update( {_id: user._id }, update ).exec();
	    	} else 
	    		console.log("User not found");
	    });
	}
	console.log("WTTTTTTTTTTTTFFFF");
	res.redirect('/home');
});

app.get('/users', user.list);

app.get('/settings', function(req, res){
	res.render('settings.jade', {
    	locals: { message: '' }
  });
});

app.post('/settings', loadUser, function(req, res){
	//// check if logged in...

	//console.log("STARTS HERE ========================================================================================================================================================================================================================================")
	//console.log(req);
	//console.log("Middle HERE ========================================================================================================================================================================================================================================")
	//console.log(res);
	console.log(req);
	console.log("ENDS HERE ==========================");
	console.log(req.body);
	console.log(User);
	console.log(user);
	if ((req.body["newPassword"] === req.body["confirmPassword"]) && (req.body["newPassword"] !== '')) {
		console.log("Valid new password");
		// change password
		//User.path('hashed_password').set(function (v) {
		//	return capitalize(v);
		//});
		//console.log(User.password)
		//console.log(User.encryptPassword(req.body["newPassword"]));
		//console.log(User.update({ hashed_password: User.encryptPassword(req.body["newPassword"]) }) );
		User.findOne({ email: req.currentUser.email }, function (err, user) {

			if (user) {				
				console.log(user);
				console.log(user.password);
				//User.update({ id: user._id }, { hashed_password: req.body["newPassword"] }).exec();
				user.password = req.body["newPassword"];
				console.log(user);
				console.log(user.password);
				user.save();
			}
		});
		//User.save();
		req.session.messages = ['Password updated successfully'];
	}
	else {
		console.log("Invalid new password");
		req.session.messages = ['ERROR: Passwords must match'];
	}
	res.render('settings.jade', {
		locals: { message: req.session.messages }
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port %d, environment: %s', app.get('port'), app.settings.env)
  console.log('Using connect %s, Express %s, Jade %s', connect.version, express.version, jade.version);
});