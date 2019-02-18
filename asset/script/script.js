$(function () {
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
    console.log(data)
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
    console.log(data)
    $('.js_step_3').hide()
    $('.js_step_4').show()
    webrtc.joinRoom('video')
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
    socket.emit('close', roomm)
  })

  // 关闭
  socket.on('close', data => {
    if (data == roomm) close()
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
    $(video).hide()
  })

  webrtc.on('videoRemoved', function (video, peer) {
      var dest = $('video[id="dest-' + peer.id + '"]')
      dest && dest.remove()
  })
  // video end
})
