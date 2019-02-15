$(function () {
  // 显示第一页
  // $('.js_step_1').show()
  // 创建 IO
  const socket = io()
  let room_id = 0
  let user_id = 0
  let second = 59

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

  // 开始匹配
  $('.start').click(function() {
    socket.emit('waiting', null)
    $('.js_step_2').hide()
    $('.js_step_3').show()
  })

  // 分配房间，调试使用
  $('.open').click(function() {
    console.log('a')
    socket.emit('open', null)
  })


  // 提醒
  $('.js_pop').click(function() {
    alert('功能待完善')
  })

  // 进入房间
  socket.on('room', function(data){
    if (data.room_id) {
      room_id = data.room_id
      user_id = data.user_id
      $('.js_step_3').hide()
      $('.js_step_4').show()
      const clock = window.setInterval(function() {
        second -= 1
        console.log(second)
      }, 1000)
    }
  })

  // 退出
  $('.js_quit').click(function() {
    room_id = 0
    user_id = 0
    $('.js_step_4').hide()
    $('.js_step_2').show()
  })
})
var isChannelReady = false
var isInitiator = false
var isStarted = false
var localStream
var pc
var remoteStream
var turnReady

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
}

var room = 'foo'
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
    alert('getUserMedia() error: ' + e.name)
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
    alert('Cannot create RTCPeerConnection object.')
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

