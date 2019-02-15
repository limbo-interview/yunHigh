$(function () {
  let isChannelReady = false
  let isInitiator = false
  let isStarted = false
  let localStream
  let pc
  let remoteStream
  let turnReady
  let roomm = null

  const pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  }
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
    startVideo(data)
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
    isStarted = false
    localStream = undefined
    isInitiator = false
    isChannelReady = false
    room = null
  }

  function startVideo(room) {
    roomm = room
    var socket = io.connect()

    // 如果房间不为空，创建或者加入
    if (room !== '') socket.emit('create or join', room)
    // 创建房间
    socket.on('created', () => isInitiator = true)
    // 加入房间
    socket.on('join', () => isChannelReady = true)
    socket.on('joined', () => isChannelReady = true)

    const sendMessage = message => socket.emit('message', message)

    socket.on('message', function(message) {
      if (message === 'got user media') {
        maybeStart()
      } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
          maybeStart()
        }
        pc.setRemoteDescription(new RTCSessionDescription(message))
        doAnswer()
      } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message))
      } else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        })
        pc.addIceCandidate(candidate)
      }
    })

    var localVideo = document.querySelector('#localVideo')
    var remoteVideo = document.querySelector('#remoteVideo')

    navigator
      .mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      .then(gotStream)
      .catch(function(e) {
        console.log('getUserMedia() error: ' + e.name)
      })

    function gotStream(stream) {
      localStream = stream
      localVideo.srcObject = stream
      sendMessage('got user media')
      if (isInitiator)  maybeStart()
    }

    var constraints = {
      video: true,
      audio: true,
    }

    if (location.hostname !== 'localhost') {
      requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
      )
    }

    function maybeStart() {
      console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady)
      if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection')
        createPeerConnection()
        pc.addStream(localStream)
        isStarted = true
        console.log('isInitiator', isInitiator)
        if (isInitiator) {
          doCall()
        }
      }
    }

    function createPeerConnection() {
      try {
        pc = new RTCPeerConnection(null)
        pc.onicecandidate = handleIceCandidate
        pc.onaddstream = handleRemoteStreamAdded
      } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message)
        console.log('Cannot create RTCPeerConnection object.')
        return
      }
    }

    function handleIceCandidate(event) {
      console.log('icecandidate event: ', event)
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        })
      } else {
        console.log('End of candidates.')
      }
    }

    function handleCreateOfferError(event) {
      console.log('createOffer() error: ', event)
    }

    function doCall() {
      console.log('Sending offer to peer')
      pc.createOffer(setLocalAndSendMessage, handleCreateOfferError)
    }

    function doAnswer() {
      console.log('Sending answer to peer.')
      pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
      )
    }

    function setLocalAndSendMessage(sessionDescription) {
      pc.setLocalDescription(sessionDescription)
      console.log('setLocalAndSendMessage sending message', sessionDescription)
      sendMessage(sessionDescription)
    }

    function onCreateSessionDescriptionError(error) {
      trace('Failed to create session description: ' + error.toString())
    }

    function requestTurn(turnURL) {
      var turnExists = false
      for (var i in pcConfig.iceServers) {
        if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
          turnExists = true
          turnReady = true
          break
        }
      }
      if (!turnExists) {
        console.log('Getting TURN server from ', turnURL)
        // No TURN server. Get one from computeengineondemand.appspot.com:
        var xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            var turnServer = JSON.parse(xhr.responseText)
            console.log('Got TURN server: ', turnServer)
            pcConfig.iceServers.push({
              'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
              'credential': turnServer.password
            })
            turnReady = true
          }
        }
        xhr.open('GET', turnURL, true)
        xhr.send()
      }
    }

    function handleRemoteStreamAdded(event) {
      console.log('Remote stream added.')
      remoteStream = event.stream
      remoteVideo.srcObject = remoteStream
    }
  }
})
