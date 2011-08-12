var chain = new (require('chainer'));
var hipchat = require('./index');
var hip = new hipchat('api-key-goes-here');
var rooms = hip.Rooms;

// Get a list of rooms.
chain.add(function(){
  rooms.list(function(err, res){
    if (err) throw new Error(err.message);
    console.log('Rooms: ', res);
    chain.next(res.rooms[0].room_id);
  });
});

// Get detailed room info.
chain.add(function(id){
  rooms.show(id, function(err, res){
    if (err) throw new Error(err.message);
    console.log('Room #'+id+': ', res);
    chain.next(id);
  });
});

// Send a message to the room.
chain.add(function(id){
  rooms.message(id, 'Name', 'This is a test', function(err, res){
    if (err) throw new Error(err.message);
    console.log('Message sent: ', res);
    chain.next(id);
  });
});

// View history of a room.
chain.add(function(id){
  rooms.history(id, function(err, res){
    if (err) throw new Error(err.message);
    console.log('Recent messages: ', res);
    chain.next(id);
  });
});

chain.run();