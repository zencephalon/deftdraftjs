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

	user.save(function(err){
		if (err)	return userSaveFail();
		req.session.messages = [ req.body.user.name  , ' your account has been created'];
		console.log( req.body.user.name  ,"Account created");
		req.session.user_id = user.id;
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
	var d_id = req.body.user.d_id;
	console.log(req.body.user);
	var commit_statement = req.body.user.commitstatement;
	var content;

	function createNewCollection(){
		var coll = new Doc_Collection({ doc_id: d_id, commit_statement:  commit_statement, docs: content });
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
				Doc_Collection.update({ _id: coll_id }, { $push: {'docs': content, 'commit_statement': commit_statement } }, 
					function(err, result){	console.log(result);	});
			} else{
				console.log("Collection not found. Creating a new one");
				createNewCollection();
			}
		});
	}

	Document.findOne({ _id: d_id }, function(err, doc){
		if (doc){
			content = doc["content"];
			console.log("content", content);
			callback();
		} else
			console.log("Document not found");
	});
	res.redirect('/document/'+d_id+'');
});

app.get('/:d_id/commit_history', loadUser, function(req, res){

	Doc_Collection.findOne({ doc_id: d_id }, function(err, collection){
		if (collection){
				console.log("Collection found... Showing commit history");
				coll_id = collection._id;
				//prev_docs = collection.docs.push(content); //[content, collection.docs ];
				//prev_commits = collection.commit_statement.push(commit_statement); // [commit_statement, collection.commit_statement ];
				/*Doc_Collection.update({ _id: coll_id }, { $set: {'docs': prev_docs, 'commit_statement': prev_commits } }, 
					function(err, result){	console.log(result); });*/
				Doc_Collection.update({ _id: coll_id }, { $push: {'docs': content, 'commit_statement': commit_statement } }, 
					function(err, result){	console.log(result);	});
			} else{
				console.log("Collection not found");
			}
	});

});

app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port %d, environment: %s', app.get('port'), app.settings.env)
  console.log('Using connect %s, Express %s, Jade %s', connect.version, express.version, jade.version);
});