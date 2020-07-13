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
       	console.log("result");
		      console.log(result);
		      console.log("--results");
		      console.log(results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/api/v1/fetch-bill', async(req, res, next)=>{
 	 	    try {
		      const client = await pool.connect();
		      const result = await client.query('SELECT customername,dueAmount,dueDate,refID FROM user_info WHERE mobileNumber='+req.body.mobileNumber);
		      const results = { 'results': (result) ? result.rows : null};
		       var rc = result.rowCount;
		       if(rc==0) {
		       		res.status(404).send("customer-not-found");
		       }else{
		      		res.send( result.rows[0]); 	
		       }
		      client.release();
		    } catch (err) {
		      console.error(err);
		      res.send("post error " + err);
		    }
  })
    .post('/api/v1/payment-update', async(req, res, next)=>{
 	 	    try {
 	 	    	var ref = String(req.body.refID);
 	 	    	console.log(typeof ref) ;
 	 	    	//int amtpaid =  req.body.transaction.amountPaid;
 	 	    	//var paiddate = req.body.transaction.date;
 	 	    	//var tid = req.body.transaction.id;
 	 	    	//first get id fro this ref , if null populate it and move on .Populate date 
 	 	    	//if not null validate it against provided tid . And throw error
 	 	    	var ids = [ref]; 
 	 	    	console.log(ids);
 	 	    	console.log(ids.length);
//var q = client.query('SELECT Id FROM MyTable WHERE Id = ANY($1::int[])',[ids]);
		      const client = await pool.connect();
		      console.log("bfore first select statement");
		      var result = await client.query('SELECT id,dueamount FROM user_info WHERE refid = ANY($1::text[])',[ids]);
		      console.log("after first select statement");
		      var results = { 'results': (result) ? result.rows : null};
		       var rc = result.rowCount;
		       console.log("rc");console.log(rc);
		       if(rc==0) {
		       		res.status(404).send("invalid-ref-id");
		       }else{
		       	//id is null case - first time update
		       	console.log("main else");
		       	//console.log(tyeof result.rows[0]);
		       	console.log(result.rows[0]);
			       	if(result.rows[0].id == null){
			       		//amount mismatch case
			       		console.log(result.rows[0].dueamount);
			       		var x = result.rows[0].dueamount;
			       		console.log("trying to type cast");
			       		console.log(typeof x);
			       		//console.log(result.rows[0].dueamount);
			       		console.log(req.body.transaction.amountPaid);
			       		if(result.rows[0].dueAmount != req.body.transaction.amountPaid){
			       			res.status(400).send("amount-mismatch");
			       			console.log("inside amount mis match");
			       		}
			       		console.log("bfore first update statement");
			       		/*pool.query("UPDATE user_info SET id ="+ req.body.transaction.id+" WHERE refID ="+req.body.refID, (err, res) => {
	  					console.log(err, res);
	  					//pool.end();
						});
						console.log("after first update statement");
						pool.query("UPDATE user_info SET date ="+ req.body.transaction.date+" WHERE refID ="+req.body.refID, (err, res) => {
	  					console.log(err, res);
	  					//pool.end();
						});*/
						console.log("after second update statement");
			       	}
			       	//id mis match case - provided is diff from already existing
			       	else if (result.rows[0].id != req.body.transaction.id) {
			       		res.status(404).send("invalid-ref-id");
			       	}
			       	console.log("everything done");
			       	result =  await client.query('SELECT ackID FROM user_info WHERE refid = ANY($1::text[])',[ids]);
			       	//await client.query('SELECT ackID FROM user_info WHERE refID='+req.body.refID);
		      		results = { 'results': (result) ? result.rows : null};
		      		res.send( result.rows[0]); 	
		       }
		      client.release();
		    } catch (err) {
		      console.error(err);
		      res.send("post error " + err);
		    }
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
