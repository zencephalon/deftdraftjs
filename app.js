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

//app.engine('html', require('jade').renderFile);

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
app.use('/public', express.static(__dirname + '/public'));
app.get('/*', function(req, res, next){ 
  res.setHeader('Last-Modified', (new Date()).toUTCString());
  next(); 
});
//app.set('')

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
  app.Doc_Collection = Doc_Collection = mongoose.model('Doc_Collection');
  app.Docs = Docs = mongoose.model('Docs');
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
	//res.send('user' + req.params.id);
	var d_title, d_content;
	var callback = function(){
		//get all the bills
		res.render('editor.jade',{ 
			locals: {title: d_title, content: d_content, d_id: d_id }
		});
		//res.sendfile(__dirname+'/views'+'/editor.html');
	}
	var d_id = req.url.split('/')[2];
	
	var pagetitle = Document.findOne({ _id: d_id }, function(err, doc){
		d_title = doc.title;
		d_content = doc.content;
	}).exec(callback);
});

app.post('/document/:d_id', loadUser, function(req, res){
	console.log(req.body);
	var d_id = req.url.split('/')[2];				//document id
	console.log("d_id", d_id);
	Document.update(
		{ _id: d_id }, { $set: {'content': req.body.content} }, function(err, result){
			console.log(result);
		}
	)
});

app.get('/logout', function(req, res){
	req.session.destroy();
	res.clearCookie('logintoken');
	res.redirect('/');
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
	console.log( "req.body.doc", req.body["doc"] );

	var doc = new Document(req.body["doc"]);
	doc["members"] = doc["members"].concat(req.currentUser.email);
	//doc["title"]  = req.body.doc["title"];
	//doc["content"] = req.body.doc["content"];

	//add this document to each user
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
	res.redirect('/home');
});

app.post('/commit', loadUser, function(req, res){
	//get content from editor
	console.log("HHHH", req.body);

	var d_id = req.body.d_id;
	var commit_statement = req.body.commit_statement;
	var content;
	var uniq = 'uniq' + (new Date()).getTime();

	function createNewCollection(){
		doc = new Docs({ text: content, uniq_id: uniq });
		doc.save();
		var coll = new Doc_Collection({ doc_id: d_id, commit_statement: commit_statement, docs: doc });
		coll.save();
	}

	function callback(){
		//save content and corresponding d_id in a collection
		Doc_Collection.findOne({ doc_id: d_id }, function(err, collection){
			if (collection){
				coll_id = collection._id;
				//prev_docs = collection.docs.push(content); //[content, collection.docs ];
				//prev_commits = collection.commit_statement.push(commit_statement); // [commit_statement, collection.commit_statement ];
				console.log("Collection found... adding commit to collection");
				/*Doc_Collection.update({ _id: coll_id }, { $set: {'docs': prev_docs, 'commit_statement': prev_commits } }, 
					function(err, result){	console.log(result); });*/
				doc = new Docs({ text: content, uniq_id: uniq });
				console.log("doc", doc);
				doc.save();
				Doc_Collection.update({ _id: coll_id }, { $push: {'docs': doc, 'commit_statement': commit_statement } }, 
					function(err, result){	console.log(result);	});
			} else{
				console.log("Collection not found. Creating a new one");
				createNewCollection();
			}
		});
	}

	Document.findOne({ _id: d_id }, function(err, doc){
		if (doc){
			content = req.body.content;
			console.log("content", content);
			callback();
			res.redirect('/document/'+d_id+'');
		} else
			console.log("Document not found");
	});
});

app.get('/:d_id/commithistory', loadUser, function(req, res){
	var d_id = req.url.split('/')[1]; 
	var content = [], commit_statement, uniq = [];
	Doc_Collection.findOne({ doc_id: d_id }, function(err, collection){
		if (collection){
			console.log("Collection found... Showing commit history");
			coll_id = collection._id;
			docs = collection.docs;
			commit_statement = collection.commit_statement;
				
			//uniq = collection.uniq_id;
			console.log("docs.length", docs.length);
			for (var i = 0; i < docs.length ; i++ ){
				console.log(i);
				Docs.findOne({ uniq_id: docs[i].uniq_id }, function(err, doc){
					if (doc){
						console.log("doc.text", doc.uniq_id);
						content.push(doc.text.text);
						uniq.push(doc.uniq_id);
					}
				}).exec(renderFile);
			}
		} else{
			console.log("Collection not found");
			renderFile();
		}
	});
	var commit_count = 0;
	function renderFile(){
		commit_count++
		console.log("docs.length", docs.length);
		//wait for all commits to load
		if ( commit_count > docs.length-1 ){
			console.log("uniq", uniq);
			res.render('commithistory.jade',{
				locals: { title: 'Commit history', docs: content, commit_statement: commit_statement, uniq: uniq, d_id: d_id}
			});
		}
	}
});

app.get('/:d_id/:uniq_id', loadUser, function(req, res){
	var d_id = req.url.split('/')[1]; 
	var uniq_id = req.url.split('/')[2];
	var content;
	Doc_Collection.findOne({ doc_id: d_id }, function(err, collection){
		if (collection){
			console.log("In here");
			Docs.findOne({ uniq_id: uniq_id }, function(err, doc){
				if (doc)
					content = doc.text;
			}).exec(renderFile);
		} else{
			console.log("Collection not found");
			renderFile();
		}
	});
	function renderFile(){
		console.log(content);
		res.render('commitpages.jade',{
			locals: { d_id: d_id, uniq: uniq_id, content: content }
		});
	}

});

app.get('/users', user.list);
app.get('/editor', routes.editor);

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