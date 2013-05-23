var  model = require('../models/news');

NewsController = function(mongoose) {
	var self = this;
	model.define(mongoose, function() {
	  self.News = mongoose.model('News');
	});
};

NewsController.prototype.list = function(req, res) {
	this.News.find().sort('-createdAt').exec(function(err, news) {
    	news = news.map(function(n) {
      		return { title: n.title, id: n._id, body: n.body, createdAt: n.createdAt };
    	}); 
    	res.render('news/list.jade', {locals: {news: news}});
  	});
};

NewsController.prototype.show = function(req, res, next) {
	this.News.findOne({ _id: req.params.id}, function(err, news) {
    	if (!news) return next(new NotFound('Document not found'));
	    switch (req.params.format) {
    	  	case 'json':
        		res.send(news.toObject());
      		break;
	    	case 'html':
    	    	res.send(news.toObject());
        		//res.send(markdown.toHTML(news.data));
      		break;
		    default:
	    	    res.render('news/show.jade', {
	        	  locals: {n: news}
	        	});
	    }
  	});
};

NewsController.prototype.create = function(req, res) {
  	var self = this;
  	res.render('news/new.jade', {n: new self.News()});
};

NewsController.prototype.edit = function(req, res, next) {
	this.News.findOne({ _id: req.params.id}, function(err, news) {
    	if (!news) return next(new NotFound('Document not found'));
   		res.render('news/edit.jade', {locals: {n: news}});
	});
};

NewsController.prototype.update = function(req, res, next) {
	this.News.findOne({ _id: req.params.id}, function(err, news) {
	    if (!news) return next(new NotFound('Document not found'));
	    news.title = req.body.title;
	    news.body = req.body.body;
	    news.save(function(err) {
	      switch (req.params.format) {
	        case 'json':
	          res.send(news.toObject());
	        break;
	        default:
	       //   req.flash('info', 'Document updated');
	          res.redirect('/news');
	      }
	    });
  	});
};

NewsController.prototype.save = function(req, res) {
  var n = new this.News(req.body);
  n.save(function() {
    switch (req.params.format) {
      case 'json':
        var data = n.toObject();
        // TODO: Backbone requires 'id', but can I alias it?
        data.id = data._id;
        res.send(data);
      break;
      default:
       // req.flash('info', 'Document created');
        res.redirect('/news');
    }
  });
};

exports.NewsController = NewsController;
