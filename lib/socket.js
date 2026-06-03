let io = null;

function set(serverIo){
  io = serverIo;
}

function get(){
  return io;
}

module.exports = { set, get };
