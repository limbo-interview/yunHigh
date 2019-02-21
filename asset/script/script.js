const randomNum = maxNum => parseInt(Math.random() * (maxNum - 1),10)


$(function () {
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
  // 选择话题
  $('.js_topic').text(topic[randomNum(topic.length)])
  $('.js_avatar_w').attr('src', './image/' + randomNum(50) + '.jpg')
  $('.js_avatar_m').attr('src', './image/' + randomNum(50) + '.jpg')
  // 显示第一页
  $('.js_step_1').show()
  // 创建 IO
  const socket = io()
  let room

  //登录
  $('.js_login').click(function() {
    const value = $('.js_username').val()
    if(!value) {
      alert('请输入用户名')
    } else {
      $('.js_step_1').hide()
      $('.js_step_2').show()
      socket.emit('login', value)
    }
  })

  // 显示所有用户数
  socket.on('friends', data => {
    console.log('用户数:', data)
    $('.friends').text(data)
  })

  // 开始匹配
  $('.start').click(function() {
    socket.emit('waiting', null)
    $('.js_step_2').hide()
    $('.js_step_3').show()
  })

  // 分配房间后进入页面
  socket.on('room', data => {
    room = data
    console.log('房间号:', room)
    $('.js_step_3').hide()
    $('.js_step_4').show()
    const roomm = 'room' + data
    webrtc.joinRoom(roomm)
    let second = 59
    const clock = window.setInterval(function() {
      second -= 1
      $('.js_second').text(second)
      if (second <= 0) {
        clearInterval(clock)
        close()
      }
    }, 1000)
  })

  // 提醒
  $('.js_pop').click(function() {
    alert('功能待完善')
  })

  // 退出
  $('.js_quit').click(function() {
    close()
    socket.emit('close', room)
  })

  // 关闭
  socket.on('close', data => {
    if (data == room) close()
  })

  function close() {
    $('.js_step_4').hide()
    $('.js_step_2').show()
    webrtc.leaveRoom()
  }
  // video start
  webrtc = new SimpleWebRTC({
    localVideoEl: 'myVideo',
    remoteVideosEl: '',
    autoRequestMedia: true,
    debug: false,
    detectSpeakingEvents: true,
    media: {
      video: true,
      audio: true,
    },
    autoAdjustMic: true,
  })

  webrtc.on('videoAdded', function (video, peer) {
    $(video).appendTo('body')
    $(video).attr('id', 'dest-' + peer.id)
    // $(video).hide()
  })

  webrtc.on('videoRemoved', function (video, peer) {
      var dest = $('video[id="dest-' + peer.id + '"]')
      dest && dest.remove()
  })
  // video end
})
