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
 	 	    	var ref = req.body.refID;
 	 	    	var amtpaid =  req.body.transaction.amountPaid;
 	 	    	var paiddate = req.body.transaction.date;
 	 	    	var tid = req.body.transaction.id;
 	 	    	//first get id fro this ref , if null populate it and move on .Populate date 
 	 	    	//if not null validate it against provided tid . And throw error
		      const client = await pool.connect();
		      const result = await client.query('SELECT id,dueAmount FROM user_info WHERE refID='+ref);
		      const results = { 'results': (result) ? result.rows : null};
		       var rc = result.rowCount;
		       if(rc==0) {
		       		res.status(404).send("invalid-ref-id");
		       }else{
		       	//id is null case - first time update
			       	if(result.rows[0].id == null){
			       		//amount mismatch case
			       		if(result.rows[0].dueAmount != amtpaid){
			       			res.status(400).send("amount-mismatch");
			       		}
			       		pool.query("UPDATE user_info SET id ="+ tid+" WHERE refID ="+ref, (err, res) => {
	  					console.log(err, res);
	  					pool.end();
						});
						pool.query("UPDATE user_info SET date ="+ paiddate+" WHERE refID ="+ref, (err, res) => {
	  					console.log(err, res);
	  					pool.end();
						});
			       	}
			       	//id mis match case - provided is diff from already existing
			       	else if (result.rows[0].id != tid) {
			       		res.status(404).send("invalid-ref-id");
			       	}
			       	result = await client.query('SELECT ackID FROM user_info WHERE refID='+ref);
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
