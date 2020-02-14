function Random(min, max) {
    return Math.floor(Math.random() * ((max-1) - (min+1))) + (min+1);
}
$(function () {
  var webrtc = new SimpleWebRTC({
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
  const user = $.now()
  // 创建 IO
  const socket = io()
  const room = 'room1'
  /* 显示第一页
  */
  $('.page_1 .create').click(function() {
    $('.page_1 .pop').show()
  })
  $('.page_1 .join').click(function() {
    $('.page_1 .pop').show()
  })
  $('.page_1 .friend').click(function() {
    $('.page_1').hide()
    $('.page_2').show()
    joinRoom()
  })

  $('.page_1 .add').click(function() {
    $('.page_1').hide()
    $('.page_2').show()
    joinRoom()
  })

  function joinRoom() {
    socket.emit('join', user)
  }


  /* 显示第二页
  */
  $('.page_2 .friend').click(function() {
    $('.page_2 .friend_bg').show()
    $('.page_2 .friend_list').show()
  })
  $('.page_2 .friend_bg').click(function() {
    $('.page_2 .friend_bg').hide()
    $('.page_2 .friend_list').hide()
  })
  $('.page_2 .friend_list').click(function() {
    $('.page_2 .friend_bg').hide()
    $('.page_2 .friend_list').hide()
  })
  $('.page_2 .tab li').click(function() {
    const mark = $(this).attr('mark')
    $('.page_2 .tool > div').hide()
    $('.' + mark).show()
    $('.page_2 .tab li').removeClass('active')
    $(this).addClass('active')
  })
  $('.page_2 .biaoqing div img').click(function() {
    const src = $(this).attr('src')
    $('.page_2 .self img').attr('src', src)
    $('.page_2 .self img').show()
    clearImg()
  })
  function clearImg() {
    clearTimeout(clearTime)
    var clearTime = setTimeout(
      function(){
        $('.page_2 .self img').hide()
      }, 3000
    )
  }
  $('.page_2 .beijing div img').click(function() {
    const src = $(this).attr('mark')
    $('.page_2').css('background-image', "url(../image/" + src + ".png)")
    $('.page_2').css('background-size', "100% 100%")
  })
  $('.page_2 .youxi div img').click(function() {
    const mark = $(this).attr('mark')
    if (mark === 's') {
      const src = '../image/s_' + Random(0, 4) + '.png'
      // 石头剪刀布
      $('.page_2 .self img').attr('src', src)
      $('.page_2 .self img').show()
    } else {
      const src = '../image/t_' + Random(0, 7) + '.png'
      // 石头剪刀布
      $('.page_2 .self img').attr('src', src)
      $('.page_2 .self img').show()
      // 骰子
    }
    clearImg()
  })
  socket.on('join', data => {
    console.log(room)
    console.log(data)
    webrtc.joinRoom(room)
  })
  webrtc.on('videoAdded', function (video, peer) {
    console.log(video, peer)
    // $(video).appendTo('body')
    // $(video).attr('id', 'dest-' + peer.id)
    // $(video).hide()
  })
})
