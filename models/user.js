var UserSchema;

function define(mongoose, fn) {
  var Schema = mongoose.Schema,
    //  ObjectId = Schema.ObjectId;
  
  UserSchema = new Schema({
   	'name': {type: String, index: true},
   	'sult': String,
    'hash': String,
   	'createdAt': {type: Date, default: Date.now}
  });
  
  UserSchema.virtual('id').get(function() {
   	return this._id.toHexString();
   });
  
  mongoose.model('User', UserSchema);
  
  fn();
}

exports.define = define; 