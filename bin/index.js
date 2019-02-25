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

const randomNum = maxNum => parseInt(Math.random() * (maxNum - 1),10)
const topic = [
  '北京的鬼天气咋又冷了',
  '下雪了，炸鸡配啤酒？',
  '年终奖。。。还是被裁员',
  '“流浪地球”为啥被豆瓣黑惨了',
  '二月不减肥，一年徒伤悲',
  '萝莉音 Vs 御姐音',
  '堵车 OR 一路畅通',
  '初恋那件小事：）',
  '“王者荣耀”啥段位，是大神不',
  '今天吃鸡了吗：）',
  '特斯拉modle3有兴趣不',
  '汤圆 OR 元宵',
  '燃烧我的卡路里!',
  '一起说走就走旅行，敢吗',
]
io.on('connection', socket => {
  // 登录
  socket.on('login', username => {
    const num = (users.length + 1) % 50
    users.push({
      id: socket.id,
      name: username,
      num,
    })
    // 给自己以及其他人发在线用户数
    socket.broadcast.emit('friends', users.length)
    socket.emit('avatar', num)
    socket.emit('friends', users.length)
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
})

// 每十秒匹配一次
setInterval(() => {
  const group = arrSlice(pool)
  for (let i = 0; i < group.length; i += 1) {
    const one = group && group[i] && group[i][0]
    const two = group && group[i] && group[i][1]
    if (one && two) {
      console.log(one, two)
      room += 1
      const t = topic[randomNum(topic.length)]
      let numO = 0
      let numT = 0
      let nameO = ''
      let nameT = ''
      for(let i = 0; i < users.length; i += 1) {
        if (users[i].id == one) {
          numO = users[i].num
          nameO = users[i].name
        }
        if (users[i].id == two) {
          numT = users[i].num
          nameT = users[i].name
        }
      }
      io.sockets.connected[one].emit(
        'room',
        {
          room,
          name: nameT,
          topic: t,
          num: numT,
        }
      )
      io.sockets.connected[two].emit(
        'room',
        {
          room,
          name: nameO,
          topic: t,
          num: numO,
        }
      )
  // 选择话题
      pool.splice(pool.indexOf(one), 1)
      pool.splice(pool.indexOf(two), 1)
    }
  }
}, 1000 * 10)

// 数组两两分组
const arrSlice = arr =>
  arr
    .sort(() => Math.random() > .5) // 打乱
    .map((e, i) => i % 2 ? null : [arr[i], arr[i + 1]]) // 两两取出
    .filter(Boolean)

server.listen(3000, () => {
  console.log('listening on *:3000')
})



