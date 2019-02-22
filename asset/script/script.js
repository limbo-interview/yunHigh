$(function () {
  // 显示第一页
  $('.js_step_1').show()
  // 显示 menu
  $('.js_menu').click(function() {
    $('.js_menu_box').show()
  })
  // 隐藏 menu
  $('.js_menu_box').click(function() {
    $(this).hide()
  })
  // 显示 message
  $('.js_message').click(function() {
    $('.js_message_box').show()
  })
  // 隐藏 message
  $('.js_message_box').click(function() {
    $(this).hide()
  })
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
      $('.js_name_w').text(value)
      socket.emit('login', value)
    }
  })

  // 显示所有用户数
  socket.on('friends', data => {
    console.log('用户数:', data)
    $('.friends').text(data)
  })
  // 设置头像
  socket.on('avatar', num => {
    $('.js_avatar_w').attr('src', './image/' + num + '.jpg')
  })

  // 开始匹配
  $('.start').click(function() {
    socket.emit('waiting', null)
    $('.js_step_2').hide()
    $('.js_step_3').show()
  })

  // 分配房间后进入页面
  socket.on('room', data => {
    console.log(data)
    const { room, name, topic, num } = data
    console.log('房间号:', room)
    $('.js_step_3').hide()
    $('.js_step_4').show()
    $('.js_avatar_m').attr('src', './image/' + num + '.jpg')
    $('.js_name_m').text(name)
    $('.js_topic').text(topic)
    const roomm = 'room' + room
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
