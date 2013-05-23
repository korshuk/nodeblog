var express = require('express'),
    mongoose = require('mongoose'),
    //hash = require('./pass').hash,
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

app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.logged = 'not logged';
  res.locals.message = '';
  if (err) res.locals.message = '<div class="alert alert-danger">' + err + '</div>';
  if (msg) res.locals.message = '<div class="alert alert-success">' + msg + '</div>';
  if (req.session.user) res.locals.logged = 'logged';
  next();
});

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
  userController.authenticate(req.body.username, req.body.password, req, res);
});
app.get('/logout', function(req, res){
  userController.logout(req, res);
});


app.get('/admin/users', auth, function(req, res){
  userController.list(req, res);
});
app.get('/admin/users/create', function(req, res){
  userController.create(req, res);
});
app.post('/admin/users', function(req, res){
  userController.save(req, res);
});
app.get('/admin/users/:id.:format?/delete', function(req, res) {
  userController.remove(req, res);
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