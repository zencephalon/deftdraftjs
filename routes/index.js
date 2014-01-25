
/*
 * GET home page.
 */


exports.index = function(req, res){
	res.render('index', { title: 'Express' });
  //res.redirect('/home')
  //res.render('index', { title: 'Express' });
};

exports.homepage = function(req, res){
	
}

exports.register = function(req, res){
	res.render('register', {title: 'Register'});
}

exports.badlogin = function(req, res){
	res.redirect('/login');
	//res.render('login', {title: 'Login' }, { locals: { user: new User(), badlogin_: 'true' } });
}

exports.editor = function(req, res){
	res.render('editor', { title: 'Editor' });
}

exports.settings = function(req, res){
	res.render('settings', {title: 'Settings'});
}
