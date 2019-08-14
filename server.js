const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect("mongodb+srv://alex:alex1995@freecodecamp-w89rl.gcp.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true })
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const userSchema = new Schema( {
  username: String
} );

const exerciseSchema = new Schema( {
  user_id: String,
  description: String,
  duration: String,
  date: Date
} );

var User = mongoose.model('User', userSchema);
var Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user", (req, res) => {
  let username = req.body.username
  if(username == "") {
    res.send('`username` is required.')
    return
  }
  let user1 = new User({username: username})
  user1.save()
  res.json({username: username, _id: user1._id});
})

app.post("/api/exercise/add", (req, res) => {
  let userId = req.body.userId
  let description = req.body.description
  let duration = req.body.duration
  let date = req.body.date
  if(userId == "" || description == "" || duration == "") {
    res.send("Please fill the fields")
    return
  }
  if(req.body.date == "")
    date = new Date()
  else {
    date = new Date(date)
    if(date == "Invalid Date") {
      res.send("date error")
      return
    }
  }
  User.findById({_id: userId}, (err, data) => {
    if(data == null) {
      res.send("Invalid userId")
      return
    }
  })
  let exercise = new Exercise({user_id: userId, description: description, duration: duration, date: date});
  exercise.save()
  res.json(exercise)
})

app.get('/api/exercise/log', function(req, res){
  let userId = req.query.userId
  let from = new Date(req.query.from)
  let to = new Date(req.query.to)
  if(Number.isInteger(req.query.limit)) {
    res.send("Invalid limit")
    return
  }
  let limit = parseInt(req.query.limit)
  let user = ""
  User.find({user_id: userId}, (err, data) => {
    if(data == null) {
      res.send("Invalid userId")
      return
    } else {
      user = data
    }
  })
  if(from == "Invalid Date")
    from = new Date(-8640000000000000)
  if(to == "Invalid Date")
    to = new Date(8640000000000000)
  if(limit == undefined)
    limit = Number.max_value
  let exercises = []
  let query = Exercise.find({user_id: userId, date: {$gte: from, $lte: to}}, { _id: false, user_id: false, __v: false}).limit(limit)
  query.exec((err, data) => {
    if(data != null)
      exercises = data
    res.json({"id": userId, "username": user.username, "count": "hey", "log": exercises})
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port  ' + listener.address().port)
})