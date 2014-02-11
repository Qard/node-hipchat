var http = require('https')
  , qstring = require('querystring')

// Create API section handlers.
var Rooms = function (key) { this.key = key }
var Users = function (key) { this.key = key }

/***************
 *             *
 *    Rooms    *
 *             *
 ***************/
function cbMaker (fn) {
  return typeof fn === 'function' ? fn : function () {}
}

// Get the history of a room. Selects recent if date not supplied.
Rooms.prototype.history = function (room, date, cb) {
  var cb = cbMaker(arguments[arguments.length - 1])

  if (arguments.length < 3) {
    date = 'recent'
  }

  if (typeof room === 'object') {
    data = room
  } else {
    data = {
      room_id: room
      , date: date
    }
  }

  this.request('GET', '/v1/rooms/history', data, cb)
}

// Get list of rooms.
Rooms.prototype.list = function (cb) {
  this.request('GET', '/v1/rooms/list', cb)
}

// Send a message.
Rooms.prototype.message = function(room, name, msg, data, cb) {
  var cb = cbMaker(arguments[arguments.length - 1])

  if (typeof room === 'object') {
    data = room
  } else {
    if (typeof data !== 'object') {
      data = {}
    }
    data.room_id = room
    data.from = name
    data.message = msg
  }

  this.request('POST', '/v1/rooms/message', data, cb)
}

// Get detailed room info.
Rooms.prototype.show = function (room, cb) {
  var data = typeof room !== 'object'
    ? { room: room }
    : room

  this.request('GET', '/v1/rooms/show', data, cb)
}

/***************
 *             *
 *    Users    *
 *             *
 ***************/

// Create a new user.
Users.prototype.create = function(data, cb) {
  this.request('POST', '/v1/users/create', data, cb)
}

// Delete a user.
Users.prototype.delete = function(id, cb) {
  var data = typeof id !== 'object'
    ? { user_id: id }
    : id

  this.request('POST', '/v1/users/delete', data, cb)
}

// List all user.
Users.prototype.list = function(cb) {
  this.request('GET', '/v1/users/list', cb)
}

// Show detailed user info.
Users.prototype.show = function(id, cb) {
  var data = typeof id !== 'object'
    ? { user_id: id }
    : id

  this.request('POST', '/v1/users/show', data, cb)
}

// Update a user.
Users.prototype.update = function(id, data, cb) {
  var cb = cbMaker(arguments[arguments.length - 1])

  if (typeof id === 'object') {
    data = id
  } else {
    data.user_id = id
  }

  this.request('POST', '/v1/users/update', data, cb)
}

/***************
 *             *
 *    Other    *
 *             *
 ***************/

// Generic request handler for all API sections.
var request = function (method, path, data) {
  var query = {
    format: 'json'
    , auth_token: this.key
  }

  // Merge data into query string variables.
  if (method === 'GET' && typeof data === 'object') {
    for (var i in data) query[i] = data[i]
  }

  // Build options object.
  var options = {
    host: 'api.hipchat.com'
    , port: 80
    , path: path + '?' + qstring.stringify(query)
    , method: method
    , headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  // Make sure we set the content length where needed.
  if (method !== 'GET') {
    if (typeof data === 'object' || typeof data === 'string') {
      if (typeof data !== 'string') {
        data = qstring.stringify(data)
      }
      options.headers['Content-Length'] = data.length
    }
  }

  var cb = cbMaker(arguments[arguments.length - 1])

  // Build request handler.
  var req = http.request(options, function (res) {
    var body = []
    res.setEncoding('utf8')
    res.on('data', body.push.bind(body))
    res.on('end', function () {
      body = body.join('')
      try {
        body = JSON.parse(body)
      } catch (e) {}

      if (res.statusCode === 200) {
        cb(null, body)
      } else {
        cb({
          code: res.statusCode
          , message: body
        })
      }
    })
  })

  // Handle errors
  req.on('error', cb)

  // Send data, if supplied, and we aren't using GET method.
  if (method !== 'GET') {
    if (typeof data === 'object' || typeof data === 'string') {
      if (typeof data !== 'string') {
        data = qstring.stringify(data)
      }
      req.write(data)
    }
  }

  // Run request.
  req.end()
}

// Attach generic request handler to all interfaces.
Rooms.prototype.request = request
Users.prototype.request = request

// Export the API intializer.
module.exports = function(key) {
  if ( ! key) throw new Error('Auth Token required!')
  return {
    Rooms: new Rooms(key)
    , Users: new Users(key)
  }
}
