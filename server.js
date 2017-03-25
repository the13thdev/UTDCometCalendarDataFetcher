//Importing modules
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment-timezone');


var app = express();

//setting port to listen on
app.set('port', (process.env.PORT || 5000));

//Data Variables
var time_at_utd = moment().tz("US/Central");
console.log(time_at_utd);

var urlWeb="https://www.utdallas.edu/calendar/getEvents.php?month="+(time_at_utd.month()+1)+"&year="+time_at_utd.year()+"&type=day"+time_at_utd.date();
console.log(urlWeb);
var urlRef="https://www.utdallas.edu/calendar";
//url for fetching event details, ex: http://www.utdallas.edu/calendar/event.php?id=1220426040
var urlEventDetails="http://www.utdallas.edu/calendar/event.php?id=";

var updateCurrentDateTimeAndUrlWeb = function(){
  //Data Variables
  time_at_utd = moment().tz("US/Central");
  var urlWeb="https://www.utdallas.edu/calendar/getEvents.php?month="+(time_at_utd.month()+1)+"&year="+time_at_utd.year()+"&type=day"+time_at_utd.date();
  console.log(urlWeb);
};

//middleware for logging requests
app.use(morgan('dev'));
//setting static directory for server
app.use(express.static(__dirname + '/public'));
//Middleware to parse http request body
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));

app.get('/',function(req,res,next){
  res.send("UTD Comet Calendar Data Fetcher");
});

app.get('/data',function(req,res,next){
  //to update current_date_time as day may change, and accordingly the urlWeb.
  updateCurrentDateTimeAndUrlWeb();
  request.get({ url: urlWeb, headers: {'Referer':urlRef}}, function(error, response, body){

    if(!error && response.statusCode==200){
      //Data Successfully loaded
      console.log("data fetched");

      var data={ events:[], date:{day:current_date_time.getDate() ,month:current_date_time.getMonth()+1, year:current_date_time.getFullYear()}};
      //feeding body through cheerio
      var $ = cheerio.load(body);
      var i,rows;
      rows = $('ul.cal-line-details-events li');
      console.log(rows.length);
      for(i=0;i<rows.length;++i)
      {
          for(i=0;i<rows.length;++i)
          {
            var event={};
            event.time=rows.eq(i).children('.events-time').text();
            //console.log(rows.eq(i).children('.events-time').text());
            event.name=rows.eq(i).children('.events-name').text();
            //console.log(rows.eq(i).children('.events-name').text());
            var id_attr_dom = rows.eq(i).children('.events-name').children('a').attr('id');
            event.id=id_attr_dom.substring(3,id_attr_dom.length);
            //console.log(id_attr_dom.substring(3,id_attr_dom.length));
            data.events.push(event);
          }
      }
      res.json(data);
    }  else{
      //Data could not be loadedD:
      console.log("Could not fetch data");
      console.log(error);
    }
  });
});

app.get('/eventData',function(req,res,next){
    //console.log(req.query.event_id);
    request.get({ url: urlEventDetails+req.query.event_id}, function(error, response, body){

      if(!error && response.statusCode==200){
        //Data Successfully loaded
        console.log("event details fetched");
        //feeding body through cheerio
        var $ = cheerio.load(body);
        var data={ location:$('.locationholder span').text(), description_html: $('.detailholder.description').html().trim(), contact_html: $('.contactholder').html().trim()};
        //console.log($('.detailholder.description').html().trim());
        //console.log($('.contactholder').html().trim());
        res.json(data);
      }  else{
        //Data could not be loadedD:
        console.log("Could not fetch event details");
        console.log(error);
      }
    });
});

/**
 * Middleware to be used at last to hande invalid requests made to server
 * If a request is made to the server for which an endpoint has not been defined, then this middleware displays an error text.
 */
app.use(function(req,res,next){
  res.send("Error.....!!!!");
});

//Start server
app.listen(app.get('port'),function(){
  console.log('Node app is running on port', app.get('port'));
});
