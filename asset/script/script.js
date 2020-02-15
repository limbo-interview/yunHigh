function Random(min, max) {
    return Math.floor(Math.random() * ((max-1) - (min+1))) + (min+1);
}
$(document).ready(function() {
  let rtc = null
  const room = '889988'
  const user = $.now() + ''
  // 创建 IO
  const socket = io()
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
    interact(src)
    $('.page_2 .self img').attr('src', src)
    $('.page_2 .self img').show()
    // clearImg()
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
      const src = '../image/s_' + Random(0, 5) + '.png'
      // 石头剪刀布
      $('.page_2 .self img').attr('src', src)
      $('.page_2 .self img').show()
      interact(src)
    } else {
      const src = '../image/t_' + Random(0, 8) + '.png'
      // 骰子
      $('.page_2 .self img').attr('src', src)
      $('.page_2 .self img').show()
      interact(src)
    }
    // clearImg()
  })

  $('.page_2 .hongbao div img').click(function() {
    $('.page_2 .hongbao_pop').show()
    $('.page_2 .hongbao_open').show()
    $('.page_2 .hongbao_detail').hide()
  })

  $('.page_2 .hongbao_open').click(function() {
    $('.page_2 .hongbao_open').hide()
    $('.page_2 .hongbao_detail').show()
  })
  $('.page_2 .hongbao_detail').click(function() {
    $('.page_2 .hongbao_pop').hide()
    $('.page_2 .hongbao_detail').hide()
  })

  function joinRoom() {
    $('.self > div').attr('uid', user)
    if (rtc) return;
    const userId = user;
    const roomId = room;
    const config = genTestUserSig(userId);
    rtc = new RtcClient({
      userId,
      roomId,
      sdkAppId: config.sdkAppId,
      userSig: config.userSig
    });
    rtc.join();
  }
  // joinRoom()

  function interact(src) {
    socket.emit('interact', {
      src,
      user,
    })
  }

  $('.plus').click(function() {
    let count = $(`#count_${user}`)
    count = count.length > 0 ? count.text() : 1
    socket.emit('plus', {
      id: user,
      count,
    })
  })

  socket.on('plus', param => {
    const count = $(`#count_${param.id}`)
    if (count.length > 0) {
      $(count).text(count.text() * 1 + 1)
    } else {
      const query = '[uid=' + param.id + ']'
      const nick = `${param.id.substr(param.id.length - 5)}`
      const el = `<div class='count'>好友_${nick} <span id='count_${param.id}'>${param.count}</span>杯</div>`
      $(el).appendTo(query)
    }
  })

  socket.on('interact', data => {
    const query = '[uid=' + data.user + ']'
    $(query + '> img').remove()
    $('<img />', {
      src: data.src,
    }).appendTo(query);
  })
})
