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
  .get('/db', async (req, res) => {
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
  .post('/pb', async(req, res, next)=>{
 		//console.log(req.body);
 	 	//res.send('Posted by bhagya');
 	 	    try {
		      const client = await pool.connect();
		      //var mn = req.body.mobileNumber.toString();
		      const result = await client.query('SELECT customername FROM user_info WHERE mobileNumber='+req.body.mobileNumber);
		    //  const results = { 'results': (result) ? result.rows : null};
		    var jsonData = {};
    result.forEach(function(column) 
    {
        var columnName = column.metadata.colName;
        jsonData[columnName] = column.value;
        res.send(jsonData);
        break;
    });
		      res.send(result);
		      //res.send(req.body.mobileNumber);
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
