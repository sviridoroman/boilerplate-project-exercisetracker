const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser');

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let uri = 'mongodb+srv://Roman:123321@boilerplate-project.arxwej8.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
.then((res) => console.log('Connected'))
.catch(error => handleError(error));

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
});

let exerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: Date
});



let User = mongoose.model('User', userSchema);

let Exercise = mongoose.model('Exercise', exerciseSchema);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

app.post('/api/users', (req, res) => {
  let newUser = new User({username: req.body.username})
  newUser.save((err, saved) => {
    if(!err){
      res.json({
        username: saved.username,
        _id: saved.id
      })
    } else {
      res.json({
       err
      })
    }
  })
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if(!err){
      res.json(users)
    } else {
      res.json({
        err
       })
    }
  })
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  let user = await User.findById(req.params._id);
  let formattedDate = new Date().toDateString();
  if(req.body.date)
  {formattedDate = new Date(req.body.date).toDateString();}
  let newExercise = new Exercise({
    user_id: req.params._id,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: formattedDate
  });
  newExercise.save();
  res.json({
    _id: req.params._id,
    username: user.username,
    date: new Date(newExercise.date).toDateString(),
    duration: parseInt(req.body.duration),
    description: req.body.description
   })   
});

app.get('/api/users/:_id/logs/', async (req, res) => {
  User.findById(req.params._id, (err, user) => {
    if(!err) {

      //
      let dateObj = {}
      if(req.query.from){
        dateObj["$gte"] = new Date(req.query.from)
      }
      if(req.query.to){
        dateObj["$lte"] = new Date(req.query.to)
      }
      let filter = {
        user_id: req.params._id
      }
      if(req.query.from || req.query.to ){
        filter.date = dateObj
      }

      let limit = req.query.limit ?? 20;
      //
      Exercise.find(filter).limit(limit).exec((err, exercise) => {
        if(err || !exercise){
          res.json([])
        }else{
          const count = exercise.length
          const rawLog = exercise
          const log = rawLog.map((el) => ({
            description: el.description,
            duration: parseInt(el.duration),
            date: new Date(el.date).toDateString(),
          }))
          res.json({_id: user._id, username: user.username, count, log})
        }
      })
    } else {
      res.json({
        err
      });
    }
  })
});

