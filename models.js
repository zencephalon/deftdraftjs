var crypto = require('crypto'),
    Document,
    User,
    LoginToken;

function extractKeywords(text) {
  if (!text) return [];

  return text.
    split(/\s+/).
    filter(function(v) { return v.length > 2; }).
    filter(function(v, i, a) { return a.lastIndexOf(v) === i; });
}

function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  /* Model: Documents */
  Document = new Schema({
    'doc_id': { type: String, index: true },
    'title':  String ,
    'members': [User],
    'tags': [String],
    'content': String
  });

  Document.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  Document.pre('save', function(next) {
    this.keywords = extractKeywords(this.data);
    next();
  });

  Docs = new Schema({
    'text': String
    ,'uniq_id': String
  });

  Doc_Collection = new Schema({
    'docs': [Docs]
    //'docs': [{text: String, uniq_id: String}] 
    //,'uniq_id': [String]
    ,'commit_statement': [String]
    ,'commit_id': [ObjectId]
    ,'doc_id': String
  });


  /* Model: User */
  function validate(value) {
    return value && value.length;
  }

  User = new Schema({
    'email': { type: String, validate: [validate, 'an email is required'], index: { unique: true } },
    'name': { type: String, validate: [validate, 'a name is required']},
    'hashed_password': String,
    'salt': String,
    'documents': [String]
  });

  User.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  User.virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password; });

  User.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  });
  
  User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  User.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
  });

  User.pre('save', function(next) {
    if (!validate(this.password)) {
      next(new Error('Invalid password'));
    } else {
      next();
    }
  });

  /* Model: LoginToken */
  LoginToken = new Schema({
    email: { type: String, index: true },
    series: { type: String, index: true },
    token: { type: String, index: true }
  });

  LoginToken.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  LoginToken.pre('save', function(next) {
    // Automatically create tokens
    this.token = this.randomToken();

    if (this.isNew)
      this.series = this.randomToken();

    next();
  });

  LoginToken.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  LoginToken.virtual('cookieValue')
    .get(function() {
      return JSON.stringify({ email: this.email, token: this.token, series: this.series });
    });

  mongoose.model('Document', Document);
  mongoose.model('User', User);
  mongoose.model('Docs', Docs);
  mongoose.model('Doc_Collection', Doc_Collection);
  mongoose.model('LoginToken', LoginToken);
  fn();
}

exports.defineModels = defineModels; 

