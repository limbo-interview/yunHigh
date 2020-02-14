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

io.on('connection', socket => {
  // 登录
  socket.on('join', id => {
    console.log(id)
    socket.broadcast.emit('join', id)
    socket.emit('join', id)
  })

  // 退出
  socket.on('close', room => {
    socket.leave(room)
    socket.broadcast.emit('close', room)
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})



