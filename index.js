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
  .post('/fetch-bill', async(req, res, next)=>{
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
    .post('/payment-update', async(req, res, next)=>{
 	 	    try {
 	 	    	var ref = req.body.refID;
 	 	    	var amtPaid =  req.body.transaction.amountPaid;
 	 	    	var date = req.body.transaction.date;
 	 	    	var tid = req.body.transaction.id;
 	 	    	//first get id fro this ref , if null populate it and move on .Populate date 
 	 	    	//if not null validate it against provided tid . And throw error
		      const client = await pool.connect();
		      const result = await client.query('SELECT id FROM user_info WHERE refID='+ref);
		      const results = { 'results': (result) ? result.rows : null};
		       var rc = result.rowCount;
		       if(rc==0) {
		       		pool.query("UPDATE student SET age = 24 WHERE id = 3", (err, res) => {
  					console.log(err, res);
  					pool.end();
					});
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

  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  showTimes = () => {
  let result = '';
  const times = process.env.TIMES || 5;
  for (i = 0; i < times; i++) {
    result += i + ' ';
  }
  return result;
}
