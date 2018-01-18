var mongoose = require('mongoose');
var Schema=mongoose.Schema;
var ObjectId= Schema.ObjectId;
 
var schema = new Schema({

  	status : Number,
    first_name:String,
    middle_name:String,
    last_name:String,
    moxi_works_contact_id:String,
    moxi_works_agent_id:String,
    primary_email_address:String,
    home_street_address:String

}, { versionKey: false });


module.exports = mongoose.model('exportcontact', schema);


