var express = require('express'),
    mongoose = require('mongoose'),
    hash = require('./pass').hash,
    NewsController = require('./controllers/news').NewsController,
    UserController = require('./controllers/user').UserController,
    db;

var app = express();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  


  
  app.use(express.static(__dirname + '/public'));
  app.set('db-uri', 'mongodb://localhost/nodeblog');
  db = mongoose.connect(app.set('db-uri'));

  app.use(express.cookieParser('shhhh, very secret'));
  app.use(express.session());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('view options', {pretty: true});
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Session-persisted message middleware

app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.logged = 'not logged';
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  if (req.session.user) res.locals.logged = 'logged In';
  next();
});


var users = {
  tj: { name: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash('foobar', function(err, salt, hash){
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash;
});



// Authenticate using our plain-object database of doom!

function authenticate(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  var user = users[name];
  // query the db for the given username
  if (!user) return fn(new Error('cannot find user'));
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash(pass, user.salt, function(err, hash){
    if (err) return fn(err);
    if (hash == user.hash) return fn(null, user);
    fn(new Error('invalid password'));
  })
}

function auth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/admin');
  }
}

var newsController = new NewsController(mongoose);
var userController = new UserController(mongoose);
app.get('/', function(req, res){
//  articleProvider.findAll();
});

app.get('/news', function(req, res) {newsController.list(req, res);});
app.get('/news/create', auth, function(req, res) {newsController.create(req, res);});
app.get('/news/:id.:format?', function(req, res) {newsController.show(req, res);});
app.get('/news/:id.:format?/edit', function(req, res) {newsController.edit(req, res);});
app.post('/news.:format?', function(req, res) {newsController.save(req, res);});
app.put('/news/:id.:format?', function(req, res) {newsController.update(req, res);});



app.get('/admin', function(req, res) {
  res.render('admin/login');
});
app.post('/admin', function(req, res) {
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      req.session.regenerate(function(){
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name + ' click to <a href="/logout">logout</a>. You may now access <a href="/news/create">/news create</a>.';
        res.redirect('back');
      });
    } else {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "tj" and "foobar")';
      res.redirect('admin');
    }
  });
});
app.get('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/admin');
  });
});
/*

app.get('/blog/new', function(req, res) {
    res.render('blog_new.jade', {title: 'New Post'});
});

app.post('/blog/new', function(req, res){
    articleProvider.save({title: req.param('title'), body: req.param('body')}, function(error, docs) {res.redirect('/')});
});

app.get('/blog/:id', function(req, res) {
    articleProvider.findById(req.params.id, function(error, article) {
        res.render('blog_show.jade', {title: article.title, article:article});
    });
});

app.post('/blog/addComment', function(req, res) {
    articleProvider.addCommentToArticle(req.param('_id'), {
        person: req.param('person'),
        comment: req.param('comment'),
        created_at: new Date()
       } , function( error, docs) {
           res.redirect('/blog/' + req.param('_id'))
       });
});
*/
if (!module.parent) {
  app.listen(3000);
  console.log('started');
}