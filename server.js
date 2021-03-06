var express 		    = require('express');
var app             = express();
var mongoose        = require('mongoose');
var bodyParser      = require('body-parser');
var ObjectId  		  = require('mongoose').Types.ObjectId;

var Contact         = require('./model/contact');
var Export          = require('./model/exportcontact');

var request         = require('request');
var Q = require('q');



// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json 
app.use(bodyParser.json())

//connect mongodb
mongoose.connect('mongodb://localhost/test');


var common = function(req, res, next) {

  var options = { url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011',
  headers: {
    'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
    'Accept' : 'application/vnd.moxi-platform+json;version=1',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};



function callback(error, response, body) {
  
 
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);
      return  res.json({success : true , message : "Remote Contacts listed successfully",data:data});
  }
}

request(options, callback);
}

app.get('/remotelist', common ); //To read the third part API


app.post('/createcontact', function (req, res) { //insert one

   var options = {
  url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011',
  headers: {
    'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
    'Accept' : 'application/vnd.moxi-platform+json;version=1',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};
 
function callback(error, response, body) { //saveone
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);

    var savedata = data.contacts[0];

    var secondarydata = {
      status : 1,
      first_name : savedata.first_name,
      middle_name : savedata.middle_name,
      last_name : savedata.last_name,
      moxi_works_contact_id : savedata.moxi_works_contact_id,
      moxi_works_agent_id : savedata.moxi_works_agent_id,
      primary_email_address: savedata.primary_email_address,
      home_street_address : savedata.home_street_address,

    }

    var contactData = new Contact(secondarydata);
    contactData.save(function(err,data){
    if(err){
      return res.json({message : "error"})
    }
  
    return res.json({success : true, message : "User added successfully",data : data});
  });

  }
}
request(options, callback);

});


//**************************************************  Task 1 *******************************************************************//
//Import Button to Consume Moxiworks API to fetch all page contacts and store it to the Mongo collection


app.post('/createcontactall', function (req, res) { //insert many

  var options = {
  url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011',
  headers: {
    'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
    'Accept' : 'application/vnd.moxi-platform+json;version=1',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};
 
function callback(error, response, body) { 
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);

    var savedata = data.contacts;

   

Contact.insertMany(savedata); //saveall

return res.json({success:true,Message:'contacts added successfully',data:savedata});
  }

}

request(options, callback);


 
});

//**************************************************  Task 1 *******************************************************************//


//**************************************************  Task 2 *******************************************************************//
 //Implement a user interface to list all the contacts from the collection (UI Search Filter)


app.get('/locallist', function (req, res) {


    Contact.find({}, function(err,data){

      if(err){
          return res.json({success : false , message : err + "Error while List"});
      }

      return  res.json({success : true , message : "Local Contacts listed successfully",Count:data.length,data:data});
  }); 

});

var pagecount = 2;
app.get('/locallistwithpagination' , function(req,res){

    var page        = req.query.page;
    var aggQuery    = []; 
    var countAggQuery;

    var match;
    var project;
    var cursor;
    var searchRegex             = new RegExp('^' + escape(req.query.search).replace(/%20/g, " "), 'i');
    var searchkey = { $match : { $or : [
        {first_name :  { $regex : searchRegex}}
    ]}};

    match = {$match : {}};

    aggQuery.push(match);

    aggQuery.push(searchkey);

    countAggQuery = aggQuery.slice(); //copy array to get 
    
    aggQuery.push({ $skip: ((page-1)*pagecount)});  //skip pages
    aggQuery.push({ $limit: pagecount});  //limit records


    Contact.aggregate(aggQuery , function(err,data){

        if(err){
            return res.json({sucess : false , message : err});
        }

        countAggQuery.push({ $group: { _id: null, count: { $sum: 1 } } });

        Contact.aggregate(countAggQuery,function(err,countdata){
            var count = 0;

            if(countdata && countdata.length>0){
                count = countdata[0].count;
            }
            return res.json({success : true , message : "contact Listed successfully" , count:data.length, overallcount:count, page:page,data : data});
        });
    });
});


app.get('/testaggregate' , function(req,res){

  Contact.aggregate([

    { $match: { status : 1 }}

  ] , function(err,data){
    if(err){ return res.json(err); }
    return res.json({message : "SUCCESS",data:data})

  });
});


//**************************************************  Task 2  *******************************************************************//


//**************************************************  Task 3  *******************************************************************//
// Add Button to manually add a contact to the mongo collection


app.post('/addmanualcontacts', function (req, res) {

  var data = req.body;
  data.status = 1;

  var contactData = new Contact (data);

  contactData.save(function(err,data){
    if(err){
      return res.json({message : "error"})
    }
  
    return res.json({success : true, message : "User added successfully",data : data});
  });
})

//**************************************************  Task 2  *******************************************************************//

//**************************************************  Task 4  *******************************************************************//
//Delete Button to select a particular contact and delete it


app.delete('/deletecontact', function (req, res) {
  
  var delId;

  delId = req.query.recId;

  Contact.remove( { _id: ObjectId(delId) } );

});

//**************************************************  Task 4  *******************************************************************//

//**************************************************  Task 5  *******************************************************************//

app.post('/copycontact', function (req, res) {
    Contact.find({}, function(err,contact){

      var savedata = contact;

      if(err){
          return res.json({success : false , message : err + "Error while List"});
      }

      
      Export.insertMany(savedata); //saveall

      return  res.json({success : true , message : "Local Contacts listed successfully",Count:contact.length,data:contact});

  }); 

});

//**************************************************  Task 5  *******************************************************************//


//**************************************************  Task 6  *******************************************************************//

app.get('/listpagination', function (req, res) { 

  var pageno;

  pageno = req.query.pagenum;

  if(pageno== undefined){

    var options = {
      url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011',
      headers: {
        'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
        'Accept' : 'application/vnd.moxi-platform+json;version=1',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
  }

  if(pageno !=undefined){

    var options = {
      url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011&' + 'page_number=' + pageno,
      headers: {
        'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
        'Accept' : 'application/vnd.moxi-platform+json;version=1',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
  }
 
function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);


    var contactlength = data.contacts.length;

      return  res.json({success : true , message : "Remote Contacts listed successfully",parampage:pageno,count:contactlength,data:data});
  }
}

request(options, callback);


})

//**************************************************  Task 6  *******************************************************************//


app.post('/createcontactallui', function (req, res) { //insert many


  var pageno;

  pageno = req.query.pagenum;



  var options = {
      url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011&' + 'page_number=' + pageno,
  headers: {
    'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
    'Accept' : 'application/vnd.moxi-platform+json;version=1',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};
 
function callback(error, response, body) { 
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);

    var savedata = data.contacts;

   

Contact.insertMany(savedata); //saveall

return res.json({success:true,Message:'contacts added successfully',data:savedata});
  }

}

request(options, callback);


 
});



  var savedata = [];

var testsync = function(pageno,res){

console.log('pageno' + pageno)
   var options = {
      url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011&' + 'page_number=' + pageno,
  headers: {
    'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
    'Accept' : 'application/vnd.moxi-platform+json;version=1',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};
 
function callback(error, response, body) { 
    console.log('callback');

  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);

    console.log('data length is'+ data.contacts.length)

    var currentpage = data.page_number;
    var totalpage = data.total_pages;

    console.log('currentpage is '+currentpage);

    savedata = savedata.concat(data.contacts);
    console.log('savedata length is ' + savedata.length);


    if(currentpage != totalpage){
    testsync((pageno+=1),res);
    }
    else{
      res(null,savedata)
    }


  }
}
  request(options, callback);
}


app.post('/createcontactallui2', function (req, res) { //insert many

   savedata = [];
      console.log('createcontactalluimine');


   testsync(1, function(err,listdata){

        console.log('createcontactalluimine -- ended');
if(!err){
    Contact.insertMany(savedata); //saveall
      return res.json({success:true,Message:'contacts added successfully',data:savedata});
    }

    


 
});

});

app.post('/saveallone', function (req, res) { //insert many
  
  
  function apiRatingCall (input, callback) {

var output = [];

for (var i = 0; i < 2; i++) {
var options = {
  url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011&',
  headers: {
    'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
    'Accept' : 'application/vnd.moxi-platform+json;version=1',
    'Content-Type': 'application/x-www-form-urlencoded'}
};

 request(options, function (error, response, body) {
   if (!error && response.statusCode == 200) {

    var info = JSON.parse(body)

        var savedata = data.contacts;

    output.push(savedata) //this is not working as ouput is undefined at this point

    console.log('output' + i + '=' + output)

   }
 })
 }
 setTimeout(function(){
   callback(output)

   console.log(output);
   Contact.insertMany(savedata); //saveall

   // res.json({data:output,count:output.length})
 },500)

 }

// for(var i=0;i<2;i++){
  
//   var pageno = 1;

  
//   var options = {
//       url: 'https://api.moxiworks.com/api/contacts?moxi_works_agent_id=demo_4@moxiworks.com&partner_contact_id=cont_10011&' + 'page_number=' + pageno,
//   headers: {
//     'Authorization': 'Basic  OTJlNWFiNWUtOWM4Zi0xMWU2LTgxMDUtMDA1MDU2OWMxMTlhOjVIZ1RhR1FIMm9PZVQ5Y3hmWHU2Ymd0dA==',
//     'Accept' : 'application/vnd.moxi-platform+json;version=1',
//     'Content-Type': 'application/x-www-form-urlencoded'
//   }
// };
 
// function callback(error, response, body) { 
//   if (!error && response.statusCode == 200) {
//     var data = JSON.parse(body);

//     var savedata = data.contacts;

   

// Contact.insertMany(savedata); //saveall

//   }

// }
// }


// return res.json({success:true,Message:'contacts added successfully'});

// return res.json({success:true,Message:'contacts added successfully',data:savedata});


// request(options, callback);


 
});

//**************************************************    *******************************************************************//





app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});



app.listen(3000);

console.log('Test App is running on 3000');
