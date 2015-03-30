// ================================================================
//  APP ROUTES
// ================================================================
var Article 	 = require('../models/article');
var User 			 = require('../models/user');

module.exports = function(app, passport){
	
	// =================================
	// FOR PERSISTING USER
	// =================================
	app.use(function(req, res, next){
		res.locals.currentUser = req.user;
		res.locals.errors = req.flash('error');
		res.locals.infos = req.flash('info');
		next();
	});
	
	app.get('/', function(req, res, next){
		res.redirect('/blog');
	});

	// =================================
	// FIND BY TITLE PAGE
	// =================================
	app.get('/blog/article/:title', function(req, res, next){
		if(!req.params.title) return next(new Error('No article title'));
		
		var title = fromDashToWhitespace(req.params.title);
		console.log('param title:' +title);
		Article.findOne({title: title}, function(err , article){
			if(err) return next(err);
			if(!article.published) return res.sendStatus(401);
			
				var result = (function (article){
						
						var out = article;

						//for(var j=0; j<out.length; j++){
							var body = out.body;	
							for(var i=0; i<body.length; i++){
								console.log('Inside loop: i='+i + ' and '+JSON.stringify(article) );
								if(body[i].name.match(/parr*/))
									out.body[i].value = appendPtag(body[i].value);
								if(body[i].name.match(/img*/))
									out.body[i].value = appendImgTag(body[i].value);
							}
						//}
						console.log('Priting out vlaue: '+JSON.stringify(out));
					 return out;	
					})(article)
					console.log('Modified result: '+JSON.stringify(result));

				
			res.render('article', {article:result});
		});
	});

	app.get('/blog', function(req, res, next){
		Article.find()
				.where('published').equals(true)
				.sort({ createdAt: "descending"})
				.exec(function (err , articles) {
					if (err) { return next(err); }
					console.log('loading home page: '+JSON.stringify(articles));
					
				
					res.render('index', {articles: articles});
		});
	});

	// =================================
	// 	LOGIN PAGE
	// =================================	
	// GET
	app.get('/blog/login', function(req, res, next){
		res.render('login');
	});
	// POST
	app.post('/blog/login', passport.authenticate('login-local', 
			{
				successRedirect: '/blog/profile',
				failureRedirect: '/blog/login',
				failureFlash: true
			}
		)
	);

	// =================================
	// LOGOUT PAGE
	// =================================
	app.get('/blog/logout', function(req, res, next){
		req.logout();
		res.redirect('/');
	});


	// =================================
	// ADMIN PAGE
	// =================================
	app.get('/blog/admin', function(req, res, next){
		if(isAdmin)
			res.render('admin', {user: req.user});

		res.redirect('/blog/login');
	});

	// =================================
	// POST PAGE
	// =================================

	app.post('/blog/post', function(req, res, next){
			console.log('Creating new article:');
			var body = req.body;
			console.log(body);

			
			console.log('postedArticle: ' + JSON.stringify(body));
			
			if(!req.body.title || !req.body.preview || !req.body.author){ return next(new Error('Incorrect article payload'));}
			console.log(JSON.stringify(req.body));
			var title = req.body.title;
			var preview = req.body.preview;
			var author = req.body.author;
			var body = req.body.body;
			var published = true;


		 	Article.findOne({title: title}, function(err, article){
		 		if(err) { return next(err);}
		 		if(article){
		 			req.flash('error', 'An article was found with that same title');
		 			return res.redirect('/blog/profile');
		 		}

			 	var newArticle = new Article({
				 		title: title,
				 		preview: preview,
				 		author: author,
				 		body: body,
				 		published: published,
				 		createdAt: new Date()
			 		});

			 	newArticle.save(function(err){
			 		if(err) {return next(err);}
			 	
			 		res.send('ok!');
			 	});

			});



			// function makeHTMLArticle(callback){



			// 	callback();
			// }

			// makeHTMLarticle(storeInDb);
			
	});

	// =================================
	// PROFILE PAGE
	// =================================
	app.get('/blog/profile', function(req, res, next){
		if( !isLoggedIn(req, res, next) ){
			res.redirect('/blog/login');		 
		}
		else res.render('profile', {user: req.user});	
	});


	// =================================
	// SIGNUP PAGE
	// =================================
	//GET
	// app.get('/blog/signup', function(req, res, next){
	// 	res.render('signup');
	// });
	//POST
	// app.post('/blog/signup', function(req, res, next){
	// 	console.log('registering new user: ' + JSON.stringify(req.body));
	// 	if(!req.body.email|| !req.body.password){ return next(new Error('Incorrect admin payload'));}
	// 	var email = req.body.email;
	// 	var password = req.body.password;
	// 	var displayName = req.body.displayName;
	// 	var bio = req.body.bio;
	// 	var admin = false;

	//  	User.findOne({email: email}, function(err, user){
	//  		if(err) { return next(err);}
	//  		if(user){
	//  			req.flash('error', 'A user was found with that same email');
	//  			return res.redirect('/blog/signup');
	//  		}

	// 	 	var newUser = new User({
	// 		 		email: email,
	// 		 		password: password,
	// 		 		admin: admin,
	// 		 		displayName: displayName,
	// 		 		bio: bio,
	// 		 		createdAt: new Date()
	// 	 		});

	// 	 	newUser.save(function(err){
	// 	 		if(err) {return next(err);}
	// 	 		res.redirect('/blog/login');
	// 	 	});

	// 	});
	// });

	// =================================
	// 404 PAGE
	// =================================
	app.use('*', function(req, res){
 		res.render('404');
	});

	//===================================================
	// HELPER FUNCTIONS
	//===================================================

	// =================================
	// CHECK IF REQUEST IS AUTHENTICATED
	// =================================
	function isLoggedIn(req, res, next){
			return req.isAuthenticated();
	}

	function isAdmin(req, res, next){
		return isLoggedIn && req.user.admin;
	}

	// ==================================================
	// Replaces white space characters with dashes
	// ==================================================
	function fromWhitespaceToDashes(title){
		return title.replace(/ +/g, '-');
	}

	function fromDashToWhitespace(title){
		return title.replace(/-/g, ' ');
	}

	// =================================
	// Append html tags
	// =================================
	function appendPtag(parr){
		return '<p>'+parr+'</p>';
	}

	function appendImgTag(url){
		return '<img class="pure-img" src="'+url+'">'
	}



}