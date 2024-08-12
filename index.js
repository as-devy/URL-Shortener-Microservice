require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const { Client } = require('pg');
const serviceAccount = require('./url-shortener-ba7ca-firebase-adminsdk-b7nkz-70a231ec4b.json');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const dns = require("dns")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));



app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;

  try {
    const urlObj = new URL(url);

    const text = 'INSERT INTO urls(url) VALUES($1) RETURNING *';
    const values = [urlObj.origin];

    try {
      const dbres = await client.query(text, values);

      res.json({
        original_url: urlObj.origin,
        short_url: Number(dbres.rows[0].id)
      })
    } catch (err) {
      console.error('Error inserting record', err.stack);
    }


  } catch (error) {
    if (error) {
      res.json({ error: "Invalid URL" })
    }
  }

});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = req.params.short_url;

  const readText = `SELECT * FROM urls WHERE id=${short_url}`;
  const readRes = await client.query(readText);
  if (readRes.rows[0].url){
    res.redirect(readRes.rows[0].url)
  }else{
    res.json({ error: "Short URL Doesn't Exist" })
  }
  
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
