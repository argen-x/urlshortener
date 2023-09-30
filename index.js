require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();
const dns = require('dns')
const urlparser = require('url')

const { MongoClient } = require('mongodb')
const client = new MongoClient(process.env.DB_URL)
const db = client.db("urls")
const urls = db.collection("urls")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//You can POST a URL to /api/shorturl and get a JSON response with original_url and short_url properties. Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}

app.post('/api/shorturl', function(req, res) {

  console.log(req.body)
  const original_url = req.body.url

  if (original_url == null || original_url == undefined) {
    res.json({ error: 'invalid url' })
  }
  // lookup the hostname passed as argument
  const dnslookup = dns.lookup(urlparser.parse(original_url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: 'invalid url' })
      } else {
        const url_count = await urls.countDocuments({})
        const url_document = {
          url: original_url,
          short_url: url_count
        }

        const result = await urls.insertOne(url_document)

        console.log(result)

        res.json({ original_url: original_url, short_url: url_count })
      }
    })

})

app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = req.params.short_url
  const url_document = await urls.findOne({ short_url: +short_url })
  res.redirect(url_document.url)
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
