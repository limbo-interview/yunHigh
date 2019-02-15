const Koa = require('koa')
const path = require('path')
const app = new Koa()
const Router = require('koa-router')
const serve = require('koa-static')
const fs = require('fs')
const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

app.use(serve(path.resolve(__dirname, '../asset')))
let router = new Router()
router.get('/', ctx => {
  ctx.response.type = 'html'
  ctx.response.body = fs.createReadStream('./asset/index.html')
})

app.use(router.routes())

// 所有用户组
let users = []
// 待匹配用户组
let pool = []
// 房间号
let room = 0

io.on('connection', socket => {
  // 登录
  socket.on('login', username => {
    users.push({
      id: socket.id,
      name: username,
    })
    console.log(users.length)
    socket.emit('friends', users.length + 1)
  })

  // 断开连接
  socket.on('disconnect', state => {
    users = users.filter(v => v.id !== socket.id)
    pool = pool.filter(v => v.id !== socket.id)
  })

  // 加入匹配
  socket.on('waiting', () => {
    // 进入匹配池
    pool.push(socket.id)
    // 排重
    pool = Array.from(new Set(pool))
  })

  // 退出
  socket.on('close', room => {
    socket.leave(room)
    socket.broadcast.emit('close', room)
  })

  // 视频部分 start
  socket.on('message', function(message) {
    socket.broadcast.emit('message', message)
  })

  socket.on('create or join', function(room) {
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    if (numClients % 2 === 0) {
      socket.join(room);
      socket.emit('created', room, socket.id);
    } else if (numClients % 2 === 1) {
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    }
  })
  // 视频部分 end
})

// 每十秒匹配一次
setInterval(() => {
  const group = arrSlice(pool)
  for (let i = 0; i < group.length; i += 1) {
    const one = group && group[i] && group[i][0]
    const two = group && group[i] && group[i][1]
    if (one && two) {
      room += 1
      io.sockets.connected[one].emit('room', room)
      io.sockets.connected[two].emit('room', room)
      pool.splice(pool.indexOf(one), 1)
      pool.splice(pool.indexOf(two), 1)
    }
  }
}, 1000 * 1)

// 数组两两分组
const arrSlice = arr =>
  arr
    .sort(() => Math.random() > .5) // 打乱
    .map((e, i) => i % 2 ? null : [arr[i], arr[i + 1]]) // 两两取出
    .filter(Boolean)

server.listen(3000, () => {
  console.log('listening on *:3000')
})



