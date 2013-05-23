var  model = require('../models/user'),
    hash = require('../pass').hash;

UserController = function(mongoose) {
	var self = this;
	model.define(mongoose, function() {
	  self.Users = mongoose.model('User');
	});
};

UserController.prototype.list = function(req, res) {
	this.Users.find().sort('-createdAt').exec(function(err, users) {
    	users = users.map(function(u) {
      		return { name: u.name, id: u._id, createdAt: u.createdAt };
    	}); 
    	res.render('users/list.jade', {locals: {users: users}});
  	});
};

UserController.prototype.show = function(req, res, next) {
	this.Users.findOne({ _id: req.params.id}, function(err, users) {
    	if (!users) return next(new NotFound('Document not found'));
	    switch (req.params.format) {
    	  	case 'json':
        		res.send(users.toObject());
      		break;
	    	case 'html':
    	    	res.send(users.toObject());
        		//res.send(markdown.toHTML(news.data));
      		break;
		    default:
	    	    res.render('users/show.jade', {
	        	  locals: {u: users}
	        	});
	    }
  	});
};

UserController.prototype.create = function(req, res) {
  	var self = this;
  	res.render('users/new.jade', {u: new self.Users()});
};

UserController.prototype.edit = function(req, res, next) {
	this.Users.findOne({ _id: req.params.id}, function(err, users) {
    	if (!users) return next(new NotFound('Document not found'));
   		res.render('users/edit.jade', {locals: {u: users}});
	});
};

UserController.prototype.update = function(req, res, next) {
	this.Users.findOne({ _id: req.params.id}, function(err, users) {
	    if (!users) return next(new NotFound('Document not found'));
	    users.name = req.body.name;
	    users.sult = req.body.sult;
	    users.save(function(err) {
	      switch (req.params.format) {
	        case 'json':
	          res.send(users.toObject());
	        break;
	        default:
	       //   req.flash('info', 'Document updated');
	          res.redirect('/users');
	      }
	    });
  	});
};

UserController.prototype.save = function(req, res) {
  var u = new this.Users(req.body);
  u.save(function() {
    switch (req.params.format) {
      case 'json':
        var data = u.toObject();
        // TODO: Backbone requires 'id', but can I alias it?
        data.id = data._id;
        res.send(data);
      break;
      default:
       // req.flash('info', 'Document created');
        res.redirect('/users');
    }
  });
};

UserController.prototype.authenticate = function(name, pass, fn) {
  var user = users[name];
  if (!user) return fn(new Error('cannot find user'));
  hash(pass, user.salt, function(err, hash){
    if (err) return fn(err);
    if (hash == user.hash) return fn(null, user);
    fn(new Error('invalid password'));
  })
}

exports.UserController = UserController;
