 always prefer not to use a plugin or module for every problem. Using just mongoose you could do it like this:

Have a db.js for your mongoDB configuration

var mongoose = require('mongoose');
mongoose.connect("mongodb://...");
var userSchema = new mongoose.Schema({
  username: String,
  salt: String,
  hash: String
});
exports.User = mongoose.model("user", userSchema);

Use TJs pass.js file to hash passwords. It uses crypto.pbkdf2 for encryption.
Create a user by hand or use a form to allow self registration:

var db = require('./db');
var pwd = require('./pwd');
var user = new db.User();
user.username = "Admin";
pwd.hash("adminPassword", function(err, salt, hash) {
  if (err) {
    console.log(err);
  }
  user.salt = salt;
  user.hash = hash;
  user.save(function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("user saved");
    }
  });
});

Now you should have a user with username, encrypted password and hash in your db. To check on login use a middleware function:

function authenticate(name, pass, fn) {
  db.User.findOne ({username: name}, function(err, user) {
    if (!user) return fn(new Error('cannot find user'));
    hash(pass, user.salt, function(err, hash){
      if (err) return fn(err);
      if (hash == user.hash) return fn(null, user);
      fn(new Error('invalid password'));
    })
  })
}

app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      req.session.regenerate(function(){
        req.session.user = user;
        res.redirect('back');
      });
    } else {
      res.redirect('login');
    }
  });
});

// middleware
function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

// route with restrict middleware
app.get('/restricted', restrict, function(req, res){
  res.send('Wahoo! restricted area');
});

Most of the code is taken from the auth example and I added the stuff for mongoose. Hope this helps!