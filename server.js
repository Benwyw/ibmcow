const session = require('cookie-session');
const express = require('express');
var multer  = require('multer')
var storage = multer.memoryStorage();
var upload = multer({ storage: storage })
const app = express();

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const mongourl = '';
const dbName = 'test';
const client = new MongoClient(mongourl);
const userid=['demo','student'];
const ObjectID = require('mongodb').ObjectID;

client.connect((err) => {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    const db = client.db(dbName);

//Check if the user is logged in
const userLoggedIn = (name) => {
  if(name == "" || name == null)
    return false;
  else
    return true;
}

//Insert document
const insertDocument = (db, doc, callback) => {
  db.collection('restaurant').
  insertMany(doc, (err, results) => {
      assert.equal(err,null);
      console.log(`Inserted document(s): ${results.insertedCount}`);
      callback();
  });
}

//Find document
const findDocument=(db,criteria,callback)=>{
  if (criteria != null) {
    var cursor = db.collection('restaurant').find(criteria);
  }
  else {
    var cursor = db.collection('restaurant').find();
  }
  cursor.toArray((err,docs)=>{
    assert.equal(err,null);
    callback(docs);
  })
}

//Delete document
const deleteDocument=(db,criteria,callback)=>{
  db.collection('restaurant').deleteMany(criteria, (err,results) => {
    assert.equal(err,null);
    callback(results);
  })
}

//Show all restaurant on the home page
const handle_Showall= (req,res,criteria)=>{
      findDocument(db,criteria, (docs) => {
          res.status(200).render('find',{ restaurant: docs,criteria:criteria,req:req});
      });
}

//Show the detail of the restaurant the user clicked on
const handle_Detail=(criteria,res)=>{
  criteria = new ObjectID(criteria);
  criteria = {_id:criteria};
      findDocument(db,criteria, (docs) => {
          res.status(200).render('detail',{ restaurant: docs[0]});
      });
}

//Create new restaurant and store in database
const handle_Create=(req,res)=>{
    if(req.body.name==null || req.body.name == ""){ //create if restaurant name is null
      res.render('check_name');
    }else{
        
      var insertingdoc=[
        {
            "restaurant_id": req.body._id,
            "name": req.body.name,
            "borough": req.body.borough,
            "cuisine": req.body.cuisine,
            "photo":req.file,
            "address": {
              "street": req.body.street,
              "building": req.body.building,
              "zipcode": req.body.zipcode,
              "lat": req.body.lat,
              "lon":req.body.lon,
            },
            "owner": req.session.userid,
        }
      ];
    
      insertDocument(db,insertingdoc,()=>{
        res.render('restaurant_created');
      });
    
    }
  
}

//Show restaurant edit page if owner is current user
const handle_Edit = (req, res) => {
  var restaurant_id_visited = new ObjectID(req.query._id);
  restaurant_id_visited = {_id:restaurant_id_visited};
  var cursor = db.collection('restaurant').find(restaurant_id_visited);
  cursor.toArray((err,docs)=>{
    assert.equal(err,null);
    if(docs[0].owner == req.session.userid){
      console.log('This user own this document, allow edit.');
      return res.render('edit',{ restaurant:docs[0] });
    }
    else{
      return res.render('edit_err',{ id:docs[0]._id, owner:docs[0].owner});
    }
  })
}

//Apply the changes of restaurant
const perform_Edit = (req, res) => {
  console.log("Performing edit...on"+req.query._id);
  var restaurant_id_visited = new ObjectID(req.query._id);
  restaurant_id_visited = {_id:restaurant_id_visited};

  var set = {
    "restaurant_id" : req.body.restaurant_id,
    "name" : req.body.name,
    "borough" : req.body.borough,
    "cuisine" : req.body.cuisine,
    "address": {
      "street": req.body.street,
      "building": req.body.building,
      "zipcode": req.body.zipcode,
      "lat": req.body.lat,
      "lon": req.body.lon
    },
  }
  if(req.file)
    set["photo"] = req.file;

  db.collection('restaurant').updateOne(restaurant_id_visited,
    {
      $set:set
    },
    (err, results) => {
        assert.equal(err, null);
        res.redirect('/details?_id='+req.session.prevDoc);
        console.log("Done, redirecting to..."+req.session.prevDoc);
    }
  );
}

//Allow rating if not rated already
var cont = true;
const handle_Rate = (req,res) => {
  var restaurant_id_visited = new ObjectID(req.session.prevDoc);
  restaurant_id_visited = {_id:restaurant_id_visited};
  var cursor = db.collection('restaurant').find(restaurant_id_visited);
  cursor.toArray((err,docs)=>{
    assert.equal(err,null);
    for(i in docs[0].grades){
      if(docs[0].grades[i].user == req.session.userid){
        console.log('Found session user rated already.');
        cont = false;
        res.render('rated_err',{ name: req.session.userid });
        break;
      }
    }

    if(cont == true){
      db.collection('restaurant').updateOne(restaurant_id_visited,
        {
          $push:{
            "grades":{
              "user" : req.session.userid,
              "score": req.body.rate
            }
          }
        },
        (err, results) => {
            assert.equal(err, null);
            res.redirect('/details?_id='+req.session.prevDoc);
        }
      );
    }
  })
}

//Show the map of restaurant
const handle_Map=(req,res)=>{
  var criteria = new ObjectID(req.query._id);
  criteria = {_id:criteria};
  findDocument(db,criteria, (docs) => {
      res.status(200).render('map',{ lat: docs[0].address.lat,lon: docs[0].address.lon, _id:req.query._id});
  });
}

//Delete selected document
const handle_Delete=(req,res)=>{
  var criteria = new ObjectID(req.query._id);
  criteria = {_id:criteria};

  var cursor = db.collection('restaurant').find(criteria);
  cursor.toArray((err,docs)=>{
    assert.equal(err,null);
    if(docs[0].owner == req.session.userid){
      deleteDocument(db, criteria, (results) => {
        console.log("This user own this document, allow delete.");
        res.render('backtoread');
      });
    }
    else{
      res.render('deletenotallowed',{id:req.query._id,owner:docs[0].owner});
    }
  });
}

//Show the searching page that user can type in the searching requirement
const handle_Searching=(req,res)=>{
  res.status(200).render('searching');
}

//Search the restaurant with the input requirement
const handle_Search=(req,res)=>{
  var criteria={};
  if(req.body.name!="" || req.body.borough!="" || req.body.cuisine!=""){
    if(req.body.name!=""){
      criteria['name']=req.body.name;
    }
    if(req.body.borough!=""){
      criteria['borough']=req.body.borough;
    }
    if(req.body.cuisine!=""){
      criteria['cuisine']=req.body.cuisine;
    }
    console.log(criteria);
    findDocument(db,criteria, (docs) => {
      res.status(200).render('searchingresult',{ restaurant: docs});
    });
  
  }else{
    res.render('check_searching');
  }
  
}

//Provide RESTful services
const handle_RESTful=(parameter,query,res) => {
  var criteria = {};
  criteria[parameter] = query;
  findDocument(db,criteria, (docs) => {
    res.status(200).render('restful',{docs: docs});
  });
}

app.use(express.urlencoded({
  extended: true
}));

app.use(session({
  name:'session',
  keys:['key1','key2']
}));

app.set('view engine', 'ejs');
app.set('trust proxy',1);

app.post('/processlogin', (req, res) => {
  console.log("Logged in user: "+req.body.id);
  req.session.userid="";

  var correct = false;

  for(i in userid){
    if (userid[i] == req.body.id){
      req.session.userid = userid[i];
      res.redirect('/read');
      correct = true;
    }
  }

  if (correct == false)
    res.redirect(401,'/login');
});

app.post('/create', upload.single('filetoupload'),(req,res)=>{
  handle_Create(req,res);
});

app.post('/edit', upload.single('filetoupload'),(req,res)=>{
  req.session.prevDoc = req.query._id;
  perform_Edit(req, res);
});

app.post('/rate',(req,res)=>{
  handle_Rate(req,res);
});

app.post('/search',(req,res)=>{
  handle_Search(req,res);
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if(userLoggedIn(req.session.userid) == false){
    res.set('Content-Type', 'text/html');
    res.status(200).render('login');
  }
  else
    res.redirect('/read');
});

app.get('/logout', (req, res) => {
  if(userLoggedIn(req.session.userid) == true){
    console.log("Logged out user: "+req.session.userid);
    req.session.userid = "";
  }
  res.redirect('/login');
});

app.get('/create',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else
  res.render('create')
});

app.get('/read',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else
    handle_Showall(req, res,criteria=null);
});

app.get('/details',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else
    handle_Detail(req.query._id,res);
});

app.get('/edit',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else
    handle_Edit(req, res);
});

app.get('/rate',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else{
    req.session.prevDoc = req.query._id;
    res.status(200).render('rate');
  }
});

app.get('/map',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else
    handle_Map(req,res);
});

app.get('/delete',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else
    handle_Delete(req,res);
});

app.get('/searching',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else
    handle_Searching(req,res);
});

app.get('/api/restaurant/*',(req,res)=>{
  if(userLoggedIn(req.session.userid) == false)
    res.render('login_reminder');
  else{
    var path = req.path;
    console.log(path);

    var path = path.split("/");
    var parameter = path[3];
    var query = path[4].replace("%20"," ");

    console.log("parameter: "+parameter);
    console.log("query: "+query);

    handle_RESTful(parameter,query,res);
  }
});

app.get('/*', (req, res) => {  // default route for anything else
  res.set('Content-Type', 'text/plain');
  res.status(404).end("404 Not Found");
});

});

const server = app.listen(process.env.PORT || 8099, () => {
  const port = server.address().port;
  console.log(`Server listening at port ${port}`);
});

//close the DB connection on kill or Ctrl-C or exit
var leave = false;
process.on('SIGINT', () => {
  if(leave == false){
      leave = true;
      console.log("Closed DB connection");
      client.close();
      server.close();
      process.exit();
  }
});

process.on('SIGTERM', () => {
  if(leave == false){
      leave = true;
      console.log("Closed DB connection");
      client.close();
      server.close();
      process.exit();
  }
});

process.on('exit', () => {
  if(leave == false){
      leave = true;
      console.log("Closed DB connection");
      client.close();
      server.close();
      process.exit();
  }
});