require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns')
const urlparser = require('url');

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("MYURLCHECKER");
const urls = db.collection("urls");
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl',(req, res,next) =>{
  const url = req.body.url;
  dns.lookup(urlparser.parse(url,true).host, async(err,address,family)=>{
    if(!address){
      res.json({error:"Invalid url"})
      next()
    }else{
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url:urlCount
      }
      if(await urls.findOne({url:url},{upsert:true})){
        res.status(400).send({error: "Document exists"})
      }else{
      const result = await urls.insertOne(urlDoc,{upsert:true})
      
      
      
      res.json({original_url: url, short_url: urlCount})
      //urls.insertOne({original_url:url,short_url:urlCount+1})
      }
    }
  })
  
});

app.get('/api/shorturl/:short_url', async (req,res,next) =>{
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({short_url: +shorturl})
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
