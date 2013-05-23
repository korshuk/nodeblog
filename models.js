var NewsSchema;


function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
    //  ObjectId = Schema.ObjectId;
	
	/**
    * Model: Document
    */
  	NewsSchema = new Schema({
    	'title': {type: String, index: true},
    	'body': String,
    	'createdAt': {type: Date, default: Date.now}
  	});

  	NewsSchema.virtual('id').get(function() {
    	return this._id.toHexString();
    });

 	mongoose.model('News', NewsSchema);
  

  	fn();
}

exports.defineModels = defineModels; 