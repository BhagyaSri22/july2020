const cool = require('cool-ascii-faces');
const express = require('express')
var bodyParser = require('body-parser')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(bodyParser.json())
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/cool', (req, res) => res.send(cool()))
  .get('/times', (req, res) => res.send(showTimes()))
  .get('/api/v1/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/api/v1/fetch-bill', async(req, res, next)=>{
 	 	    try {
		      const client = await pool.connect();
		      if(req.body.mobileNumber==null){
		      	console.log("params case");
		      	var JSONObj = { "status": "ERROR", "errorCode": "invalid-api-parameters" };
		      	res.status(400).send(JSONObj);
		      	throw new Error('something bad happened');
		      }
		      console.log("after return casexx");
		      const result = await client.query('SELECT customername,dueAmount,dueDate,refID FROM user_info WHERE mobileNumber='+req.body.mobileNumber);
		      const results = { 'results': (result) ? result.rows : null};
		       var rc = result.rowCount;
		       if(rc==0) {
		       		var JSONObj = { "status": "ERROR", "errorCode": "customer-not-found" };
		      		res.status(404).send(JSONObj);
		       }else{
		       		var ts = String(result.rows[0].duedate);
		       		console.log(typeof ts);console.log(ts);
		       		//result.rows[0].duedate = ts.substring(0,9);
		       		var JSONObj =  {"status": "SUCCESS","data": result.rows[0]};
		      		res.send(JSONObj);//res.send( result.rows[0]); 	
		       }
		      client.release();
		    } catch (err) {
		      console.error(err);
		      var JSONObj = { "status": "ERROR", "errorCode": "unhandled-error" };
		      res.status(500).send(JSONObj);
		    }
  })
  .post('/api/v1/testupdate', async(req, res, next)=>{
 	 	    try {
 	 	     //plan is to take refid as input and set amount = 50
 	 	      var ref = String(req.body.refID);
 	 	      var ids = [ref]; 
 	 	      var tid ="1";
		      const client = await pool.connect();
		      var result = await client.query('UPDATE user_info SET id = $1::text WHERE refid = ANY($2::text[])',[tid,ids]);
			//result = await client.query('SELECT id FROM user_info WHERE mobileNumber='+req.body.mobileNumber); 
		      res.send("check db");
		      client.release();
		    } catch (err) {
		      console.error(err);
		      res.status(500).send("unhandled-error");
		    }
  })
    .post('/api/v1/payment-update', async(req, res, next)=>{
 	 	    try {
 	 	    	if(req.body.refID==null ||req.body.transaction==null||req.body.transaction.id==null || req.body.transaction.amountPaid==null||req.body.transaction.date==null){
		      		console.log("params case");
		      		var JSONObj = { "status": "ERROR", "errorCode": "invalid-api-parameters" };
		      		res.status(400).send(JSONObj);
		      		throw new Error('something bad happened');
		      	}
 	 	    	var ref = String(req.body.refID);//console.log(typeof ref) ;
 	 	    	//int amtpaid =  req.body.transaction.amountPaid;
 	 	    	//var paiddate = req.body.transaction.date;
 	 	    	//var tid = req.body.transaction.id;
 	 	    	//first get id fro this ref , if null populate it and move on .Populate date 
 	 	    	//if not null validate it against provided tid . And throw error
 	 	    	var ids = [ref]; 
		        const client = await pool.connect();//console.log("bfore first select statement");
		        var result = await client.query('SELECT id,dueamount FROM user_info WHERE refid = ANY($1::text[])',[ids]);
		        var results = { 'results': (result) ? result.rows : null};
		        var rc = result.rowCount;
		        console.log("rc");console.log(rc);
		        if(rc==0) {
		        	var JSONObj = { "status": "ERROR", "errorCode": "invalid-ref-id" };
		      		res.status(404).send(JSONObj);
		        }else{
		       	//id is null case - first time update	console.log("main else");//console.log(tyeof result.rows[0]);	console.log(result.rows[0]);
			       	var tid = String(req.body.transaction.id);
			       	var rtid = result.rows[0].id;
			       	var paiddate = req.body.transaction.date;
			       	/*console.log(typeof rtid);	console.log(rtid);
			       	console.log("-------");
			       	console.log(typeof tid);	console.log(tid);*/

			       	if(result.rows[0].id == null){
			       		//amount mismatch case
			       		//console.log(result.rows[0].dueamount);console.log(result.rows[0].dueamount);console.log(typeof fb);console.log(req.body.transaction.amountPaid);
			       		var x = result.rows[0].dueamount;
			       		var fb = req.body.transaction.amountPaid;
			       		if(x != Number(fb)){
			       			var JSONObj = { "status": "ERROR", "errorCode": "amount-mismatch" };
		      				res.status(400).send(JSONObj);
			       			//res.status(400).send("amount-mismatch");
			       			console.log("inside amount mis match");
			       		}else{
			       			result = await client.query('UPDATE user_info SET id = $1::text WHERE refid = ANY($2::text[])',[tid,ids]);
			       			result = await client.query('UPDATE user_info SET duedate = $1 WHERE refid = ANY($2::text[])',[null,ids]);
			       			result = await client.query('UPDATE user_info SET dueamount = $1 WHERE refid = ANY($2::text[])',[0,ids]);
							result = await client.query('UPDATE user_info SET date = $1::DATE WHERE refid = ANY($2::text[])',[paiddate,ids]);
			       		}
			       	}
			       	//id mis match case - provided is diff from already existing
			       	//monitor result.rows[0].id carefully
			       	
			       	else if (result.rows[0].id != tid) {
			       		console.log("invalid ref case");
			       		var JSONObj = { "status": "ERROR", "errorCode": "invalid-ref-id" };
		      			res.status(404).send(JSONObj);
			       	}
			       	console.log("everything done");
			       	result =  await client.query('SELECT ackID FROM user_info WHERE refid = ANY($1::text[])',[ids]);
		      		res.send( result.rows[0]); 	
		       }
		      client.release();
		    } catch (err) {
		      console.error(err);
		      var JSONObj = { "status": "ERROR", "errorCode": "unhandled-error" };
		      res.status(500).send(JSONObj);
		    }
  })
.post('*', function(req, res){
	var JSONObj = { "status": "ERROR", "errorCode": "path-not-found" };
	res.status(404).send(JSONObj);
})
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  showTimes = () => {
  let result = '';
  const times = process.env.TIMES || 5;
  for (i = 0; i < times; i++) {
    result += i + ' ';
  }
  return result;
}
