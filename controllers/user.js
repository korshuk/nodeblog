var  model = require('../models/user');

UserController = function(mongoose) {
	var self = this;
  this.name = 'User';
  this.viewPath = 'users/';
  this.path = 'admin/users';
  this.crypto = require('crypto');
  this.len = 128;
  this.iterations = 12000;
	model.define(mongoose, function() {
	  self.Collection = mongoose.model('User');
	});
};

UserController.prototype.hash = function (pwd, salt, fn) {
  var self = this;
  if (3 == arguments.length) {
    self.crypto.pbkdf2(pwd, salt, self.iterations, self.len, function(err, hash){
      fn(err, (new Buffer(hash, 'binary')).toString('base64'));
    });
  } else {
    fn = salt;
    self.crypto.randomBytes(self.len, function(err, salt){
      if (err) return fn(err);
      salt = salt.toString('base64');
      self.crypto.pbkdf2(pwd, salt, self.iterations, self.len, function(err, hash){
        if (err) return fn(err);
        fn(null, salt, (new Buffer(hash, 'binary')).toString('base64'));
      });
    });
  }
};

UserController.prototype.authenticate = function(name, pass, req, res) {
  var self = this;
  this.Collection.findOne({name: name}, function(err, doc) {
    if (!doc) return self.authResult(new Error('такого пользователя не существует'), req, res);
    self.hash(pass, doc.salt, function(err, hash){
      if (err) return self.authResult(err, req, res);
      if (hash == doc.hash) return self.authResult(null, req, res, doc);
      self.authResult(new Error('неверный пароль'), req, res);
    });
  });
};

UserController.prototype.authResult = function(err, req, res, doc){
  if (doc) {
    req.session.regenerate(function(){
      req.session.user = doc;
      req.session.success = 'Authenticated as ' + doc.name;
      res.redirect('back');
    });
  } else {
    req.session.error = 'Не получилось залогиниться :( <br>' + err;
    res.redirect('admin');
  }
};

UserController.prototype.logout = function(req, res){
  req.session.destroy(function(){
    res.redirect('/admin');
  });
};

UserController.prototype.findOneAndExecuteAction = function(req, res, action) {
  var self = this;
  this.Collection.findOne({ _id: req.params.id}, function(err, doc) {
    if (!doc) {
      req.session.error = new Error('такого пользователя не существует');
      res.redirect(self.path);
    } else {
      action(doc);
    }
  });
};

UserController.prototype.create = function(req, res) {
    var self = this;
    res.render(self.viewPath + 'new.jade', {u: new self.Collection()});
};

UserController.prototype.list = function(req, res) {
	var self = this;
  this.Collection.find().sort('-createdAt').exec(function(err, docs) {
    	docs = docs.map(function(doc) {
          var date = new Date(doc.createdAt);
      		return { name: doc.name, id: doc._id, createdAt: date.toDateString() };
    	}); 
    	res.render(self.viewPath + 'list.jade', {users: docs});
  	});
};

UserController.prototype.show = function(req, res, next) {
	var self = this;
  this.findOneAndExecuteAction(req, res, function(doc){
    res.render(self.viewPath + 'show.jade', {u: doc});
  });
};

UserController.prototype.edit = function(req, res, next) {
	var self = this;
  this.findOneAndExecuteAction(req, res, function(doc){
    res.render(self.viewPath + 'edit.jade', {u: doc});
  });
};

UserController.prototype.remove = function(req, res, next) {
  var self = this;
  this.findOneAndExecuteAction(req, res, function(doc){
    var name = doc.name;
    doc.remove(function() {
      req.session.success = 'Пользователь <strong>' + name + '</strong> успешно удалён';
      res.redirect(self.path);
    });
  });
};

UserController.prototype.update = function(req, res, next) {
	var self = this;
  this.findOneAndExecuteAction(req, res, function(doc){
    doc.name = req.body.name;
      if (req.body.pass != ''){
        self.hash(req.body.pass, function(err, salt, hash){
          if (err) throw err;
          doc.salt = salt;
          doc.hash = hash;
          doc.save(function() {
            req.session.success = 'Данные о пользователе <strong>' + doc.name + '</strong> обновлены';
            res.redirect(self.path);
          });
        });
      } else {
        doc.save(function(err) {
          req.session.success = 'Данные о пользователе <strong>' + doc.name + '</strong> обновлены';
          res.redirect(self.path);
        });
      }
  });
};

UserController.prototype.save = function(req, res) {
  var self = this;
  var doc = new this.Collection();
  doc.name = req.body.name;
  this.hash(req.body.pass, function(err, salt, hash){
    if (err) throw err;
    doc.salt = salt;
    doc.hash = hash;
    doc.save(function() {
      req.session.success = 'Пользователь <strong>' + doc.name + '</strong> создан';
      res.redirect(self.path);
    });
  });
};

exports.UserController = UserController;
