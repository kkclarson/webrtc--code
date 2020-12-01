'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
var isConnected = false;
var callername = "AA";
var calleename = "BB";
var callID;
var UserID = "";
var callerIP = "123:222:12:100:9867";
var calleeIP = "123:222:12:100:9867";
var sendChannel;
var receiveChannel;
var alreadyConnected = false;
var exchangedata = {
    type: "message",
    data: ""
}
var dataChannelSend = document.querySelector('textarea#data_input');
var sendButton = document.querySelector('button#send-btn');
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var friendList = document.getElementById("friendlist");
var login_if = document.getElementById("login_interface");


var pcConfig = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

var constraints = {
    audio: false,
    video: true
};
if (location.hostname !== 'localhost') {
    requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    );
}



function getUserID(ID) {
    UserID = ID;
    console.log('Get user ID!', UserID);
    onopenApp();
}




function showfriendlist() {
    console.log('Show friends list!');
    var message = { "parameters": { "LogonID": UserID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetFriends/?id=' + JSON.stringify(message),
        type: "POST",
        dataType: 'json',
        success: function(data) {
            if (data.root.row.length < 1) {
                console.log("You dont have a friend!");
            } else {
                for (var i = 0; i < data.root.row.length; i++) {
                    var friendname = data.root.row[i].NickName;
                    //var friendid=data.root.row[i].Name;
                    var addFriendMsg = "<div class='fri_list' id = '" + data.root.row[i].Name + "' onclick='onclickfriendname(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + friendname + "</div> </div>";
                    addFriendMsg = addFriendMsg.replace("\n", "<br>");
                    friendList.innerHTML = friendList.innerHTML + addFriendMsg;
                }
            }
        },
        error: function() {
            console.log("Get friends Error!");
        }
    });
}

var checkcalling;

function onopenApp() {
    login_if.style.display = 'none';
    showfriendlist();
    checkcalling = setInterval(function() {
        var message = { "parameters": { "CalleeName": UserID } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/BeingCalled/?id=' + JSON.stringify(message),
            type: "PUT",
            dataType: 'json',
            success: function(data) {
                if (data.root.Offer !== null) {
                    console.log("My friend is calling me!", data.root.Offer);
                    isConnected = true;
                    maybeStart();
                    pc.ondatachannel = receiveChannelCallback;
                    callID = data.root.CallID;
                    callerIP = data.root.CallerIP;
                    var tmpdescription = data.root.Offer;
                    console.log("CallID:" + callID + " Offer:", tmpdescription);
                    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(tmpdescription)));
                    clearInterval(checkcalling);
                    pc.createAnswer().then(sendanswer,
                        onCreateSessionDescriptionError);
                    maybeStart();

                }
            },
            error: function() {
                console.log("Checkcalling Error!");
            }
        });
    }, 3000);

}

//onopenApp();

// var testbtn = document.querySelector('button#file_btn');
// testbtn.onclick = onclickfriendname;

function onclickfriendname(calleeid) {
    clearInterval(checkcalling);
    isInitiator = true;
    calleename = calleeid;
    console.log("Callee name is:", calleename);
    maybeStart();
}


var checkanswer;

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream);

    if (!isStarted) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        if (isInitiator) {
            sendoffer();
        }
        isStarted = true;
    }

    if (isInitiator) {
        checkanswer = setInterval(seeanswer, 3000);
    }
}

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

var checkcalleecandidate;
var checkcallercandidate;
var sendcandidates;

function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        var Cmessage = { "type": "candidate", "label": event.candidate.sdpMLineIndex, "id": event.candidate.sdpMid, "candidate": event.candidate.candidate };
        //console.log("Cmessage , isInitiator , isConnected:", Cmessage, isInitiator, isConnected);
        sendcandidates = setInterval(function() {

            if (isInitiator & isConnected) {
                var message = { "parameters": { "CallID": callID, "CallerCandidates": JSON.stringify(Cmessage) } };
                //console.log("CallerCandidates is:", message);
                //console.log("After Stringify:", JSON.stringify(message));
                $.ajax({
                    url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AddCallerCandidates',
                    type: "PUT",
                    dataType: 'text',
                    headers: { 'Content-Type': 'application/json;charset=utf8' },
                    data: JSON.stringify(message),

                    success: function() {
                        //console.log("Send Caller Candidate Success!");
                        clearInterval(sendcandidates);

                        checkcalleecandidate = setInterval(seecalleecandidate, 3000);
                    },


                    error: function() {
                        console.log("Send Caller Candidate Error!");
                    }
                });
            } else if (isConnected) {
                var message = { "parameters": { "CallID": callID, "CalleeCandidates": JSON.stringify(Cmessage) } };
                //console.log("CalleeCandidates is:", message);
                //console.log("After Stringify:", JSON.stringify(message));
                $.ajax({
                    url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AddCalleeCandidates',
                    type: "PUT",
                    data: JSON.stringify(message),

                    dataType: 'text',
                    headers: { 'Content-Type': 'application/json;charset=utf8' },
                    success: function() {
                        //console.log("Send Callee Candidate Success!");
                        clearInterval(sendcandidates);

                        checkcallercandidate = setInterval(seecallercandidate, 3000);
                    },
                    error: function() {
                        console.log("Send Callee Candidate Error!");
                    }
                });
            }
        }, 3000);
    } else {
        console.log('End of candidates.');
        //clearInterval(sendcandidates);
    }
}



function seecalleecandidate() {
    var message = { "parameters": { "CallID": callID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCalleeCandidates/?id=' + JSON.stringify(message),
        type: "PUT",
        dataType: 'json',
        success: function(data) {
            if (data.root.CalleeCandidates !== null) {
                //console.log("Get Callee Candidate Success!");
                var tmpcandidate = JSON.parse(data.root.CalleeCandidates);
                //var tmpcandidate = data.root.CalleeCandidates;
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: tmpcandidate.label,
                    candidate: tmpcandidate.candidate
                });
                pc.addIceCandidate(candidate);
                clearInterval(checkcalleecandidate);
            }
        },
        error: function() {
            console.log("Get Callee Candidate Error!");
        }
    });
}


function seecallercandidate() {
    var message = { "parameters": { "CallID": callID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerCandidates/?id=' + JSON.stringify(message),
        type: "PUT",
        dataType: 'json',
        success: function(data) {
            if (data.root.CallerCandidates !== null) {
                //console.log("Get Caller Candidate Success!");
                var tmpcandidate = JSON.parse(data.root.CallerCandidates);
                //var tmpcandidate = data.root.CallerCandidates;
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: tmpcandidate.label,
                    candidate: tmpcandidate.candidate
                });
                pc.addIceCandidate(candidate);
                clearInterval(checkcallercandidate);
            }
        },
        error: function() {
            console.log("Get Caller Candidate Error!");
        }
    });
}

sendButton.onclick = sendData;

function sendoffer() {
    setDataChannel();
    pc.createOffer(setLocalAndSendOffer, handleCreateOfferError);

}

function setLocalAndSendOffer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);

    var new_sessionDescription = JSON.stringify(sessionDescription);

    let message = { "parameters": { "CallerName": callername, "CallerIP": "123:222:12:100:9867", "Offer": new_sessionDescription, "CalleeName": calleename } };

    console.log('setLocalAndSendOffer,   message:', message);
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/CallFriend',
        type: "PUT",
        dataType: 'json',
        headers: { 'Content-Type': 'application/json;charset=utf8' },
        contentType: 'application/json',
        data: JSON.stringify(message),

        success: function(data) {
            console.log("Send offer Success!", data.root.ID);
            if (data.root.ID !== "Busy") {
                callID = data.root.ID;
            }

        },
        error: function() {
            console.log("Send offer Error!", JSON.stringify(message));
        }
    });
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}



function seeanswer() {
    var message = { "parameters": { "CallID": callID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/BeingAnswered/?id=' + JSON.stringify(message),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            if (data.root.Answer !== null) {
                console.log("Get Answer Success!");
                isConnected = true;
                calleeIP = data.root.CalleeIP;
                var tmpdescription = data.root.Answer;
                console.log("The answer is :", tmpdescription);
                pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.root.Answer)));
                clearInterval(checkanswer);
                checkcalleecandidate = setInterval(seecalleecandidate, 3000);
            }
        },
        error: function() {
            console.log("Get Answer Error!");
        }
    });
}


function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
    remoteVideo.srcObject = null;
    //closevideo();
}




// function answer() {
//     maybeStart();
//     pc.ondatachannel = receiveChannelCallback;
//     var checkcalling = setInterval(function() {
//         var message = { "parameters": { "CalleeName": calleename } };
//         $.ajax({
//             url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/BeingCalled/?id=' + JSON.stringify(message),
//             type: "PUT",
//             dataType: 'json',
//             success: function(data) {
//                 if (data.root.Offer !== "") {
//                     console.log("My friend is calling me!");
//                     callID = data.root.CallID;
//                     callerIP = data.root.CallerIP;
//                     var tmpdescription = data.root.Offer;
//                     console.log("CallID:" + callID + " Offer:", tmpdescription);
//                     pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(tmpdescription)));
//                     clearInterval(checkcalling);
//                     pc.createAnswer().then(sendanswer,
//                         onCreateSessionDescriptionError);
//                     maybeStart();

//                 }
//             },
//             error: function() {
//                 console.log("Checkcalling Error!");
//             }
//         });
//     }, 3000);

// }

function sendanswer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    var new_sessionDescription = JSON.stringify(sessionDescription);
    let message = { "parameters": { "CallID": callID, "CalleeIP": "24:98:11:12:8765", "Answer": new_sessionDescription } };
    console.log('setLocalAndSendAnswer', message);
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AnswerCall',
        type: "PUT",
        headers: { 'Content-Type': 'application/json;charset=utf8' },
        data: JSON.stringify(message),
        dataType: 'text',
        success: function() {
            console.log("Send answer Success!", JSON.stringify(message));
            checkcallercandidate = setInterval(seecallercandidate, 3000);
        },
        error: function() {
            console.log("Send answer Error!");
        }
    });
}




function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

function setDataChannel() {
    sendChannel = pc.createDataChannel('sendDataChannel', null);
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;
    sendChannel.onmessage = onReceiveMessage;
}

var chatbox = document.getElementById("chat_content");

function sendData() {
    exchangedata.type = "message";
    exchangedata.data = dataChannelSend.value;
    if (exchangedata.data === '') {
        alert("请输入内容！");
    } else {
        var localsaid = "<div class='send-box' id='send_box'> <div class='image'> <img src='images/kefu2.jpg' width='640' height='640' alt='kefu2'> </div> <div class='message'>" + exchangedata.data + "</div></div>";
        //localsaid = localsaid.replace("\n", "<br>").replace(" ", "&nbsp;");
        localsaid = localsaid.replace("\n", "<br>");
        chatbox.innerHTML = chatbox.innerHTML + localsaid;
        chatbox.scrollTop = chatbox.scrollHeight; /*滚动条保持在底部 */
        var datasend = JSON.stringify(exchangedata);
        if (isInitiator) {
            sendChannel.send(datasend);
            console.log('Sent Data: ' + exchangedata.data);
        } else {
            receiveChannel.send(datasend);
            console.log('Sent Data: ' + exchangedata.data);
        }
        dataChannelSend.value = "";

    }
}

function enter_btn(a) { //回车键发送
    if (a.keyCode == 13 && a.ctrlKey) {
        // exchangedata.data += "\n";//换行
        a.default();
    } else if (a.keyCode === 13) {
        a.preventDefault(); // 阻止浏览器默认换行操作
        sendData(); // 发送文本

    }
}



function onSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    console.log('Send channel state is: ' + readyState);
    if (readyState === 'open') {
        alreadyConnected = true;
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        sendButton.disabled = false;

    } else {
        dataChannelSend.disabled = true;
        sendButton.disabled = true;

    }
}

function receiveChannelCallback(event) {
    console.log('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessage;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelStateChange() {
    var readyState = receiveChannel.readyState;
    console.log('Receive channel state is: ' + readyState);
    if (readyState === 'open') {
        alreadyConnected = true;
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        sendButton.disabled = false;

    } else {
        dataChannelSend.disabled = true;
        sendButton.disabled = true;

    }
}

function onReceiveMessage(event) {
    console.log("!!!message:", event.data);
    console.log("data type:", typeof(event.data));
    var tmpdata;
    if (typeof(event.data) === "string") {
        //console.log("This is an ArrayBuffer object!");
        tmpdata = JSON.parse(event.data);
    } else {
        tmpdata = event.data;
    }
    // var tmpdata = event.data.data;
    //var tmpdata = JSON.parse(event.data);
    console.log("tmpdata is :", tmpdata);
    if (tmpdata.type === "message") {
        console.log('Received Message:', tmpdata.data);
        var tmp = "<div class='msg-box' id='message_box'><div class='image'><img src='images/arrow.jpg' width='640' height='640' alt='arrow'></div><div class='message'>" + tmpdata.data + "</div></div>";
        tmp = tmp.replace("\n", "<br>");
        chatbox.innerHTML = chatbox.innerHTML + tmp;
        chatbox.scrollTop = chatbox.scrollHeight; /*滚动条保持在底部 */
    } else if (tmpdata.type === "offer") {
        console.log("I got an offer");
        vc.setRemoteDescription(new RTCSessionDescription(JSON.parse(tmpdata.data)));
        vc.createAnswer(setLocalAndSendVideoAnswer, handleCreateOfferError);
    } else if (tmpdata.type === "answer") {
        console.log("I got an answer");
        vc.setRemoteDescription(new RTCSessionDescription(JSON.parse(tmpdata.data)));
    } else if (tmpdata.type === "candidate") {
        console.log("I got a candidate");
        var tmpvideocandidate = JSON.parse(tmpdata.data);
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: tmpvideocandidate.label,
            candidate: tmpvideocandidate.candidate
        });
        vc.addIceCandidate(candidate);
    } else if (tmpdata.type === "videocall") {
        ongetVideoCall();
    } else if (tmpdata.type === "videoanswer") {
        maybeStartVideo();
    } else if (tmpdata.type === "picture") {
        console.log("I got a picture:", tmpdata.data);
        var tmp = "<div class='msg-box' id='message_box'><div class='image'><img src='images/arrow.jpg' width='640' height='640' alt='picture'></div><div class='message'><img src=" + tmpdata.data + " width='100' height='100' alt='picture'></div></div>";
        tmp = tmp.replace("\n", "<br>");
        chatbox.innerHTML = chatbox.innerHTML + tmp;
        chatbox.scrollTop = chatbox.scrollHeight;
    } else if (tmpdata.type === "fileinfo") {
        console.log("I got the file information!");
        receiveFile.filename = tmpdata.filename;
        receiveFile.filesize = tmpdata.filesize;
        sendtoReceiveFile();
    } else if (tmpdata.type === "receiveFile") {
        if (tmpdata.data === "1") {
            startSendFile();
        } else {
            console.log("My friend does not want to receive the file!")
        }
    } else if (tmpdata.type === "file") {
        startDownload();
        progressDownload(tmpdata.data);
    } else if (tmpdata.type === "getpiece") {
        if (bytes_per_chunk * currentChunk < fileSend.size) {
            readNextChunk();
        }
    } else if (tmpdata.type === "endfile") {
        console.log("End of sending file!");

    } else {
        console.log("Downloading!");
        downloadFile(tmpdata);

    }
}

function requestTurn(turnURL) {
    var turnExists = false;
    for (var i in pcConfig.iceServers) {
        if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
            turnExists = true;
            turnReady = true;
            break;
        }
    }
    if (!turnExists) {
        console.log('Getting TURN server from ', turnURL);
        // No TURN server. Get one from computeengineondemand.appspot.com:
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var turnServer = JSON.parse(xhr.responseText);
                console.log('Got TURN server: ', turnServer);
                pcConfig.iceServers.push({
                    'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
                    'credential': turnServer.password
                });
                turnReady = true;
            }
        };
        xhr.open('GET', turnURL, true);
        xhr.send();
    }
}


function hangup() {
    console.log('Hanging up.');
    var message = { "parameters": { "CallID": callID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/CompleteCall/?id=' + JSON.stringify(message),
        type: "PUT",
        dataType: 'text',
        success: function() {
            console.log("Finish the call!");
        },
        error: function() {
            console.log("Hang up Error!");
        }
    });
    stop();

}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}

function stop() {
    isStarted = false;
    pc.close();
    pc = null;
    isChannelReady = false;
    isConnected = false;
    alreadyConnected = false;
}

window.onbeforeunload = function() {
    var message = { "parameters": { "CallID": callID } };
    stop();
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/CompleteCall/?id=' + JSON.stringify(message),
        type: "PUT",
        async: false,
        dataType: 'text',
        success: function() {
            console.log("Finish the call!");
        },
        error: function() {
            console.log("Hang up Error!");
        }
    });
}



















var videoInitiator = false;
var vc;
var videoconnected = false;
var obtn = document.getElementById('video_btn');
var ovideo = document.getElementById('mydialog');
var oshut = document.getElementById('hangupButton');


var hidebut = document.getElementById('hidebutton'); //用于最小化视频页面
var oharea = document.getElementById('hiddenarea');
var ohact = document.getElementById('hiddenact');

hidebut.onclick = function() { //用于最小化视频页面
    ovideo.style.display = 'none';
    oharea.style.display = 'block';
}
ohact.onclick = function() { //用于还原视频页面
    ovideo.style.display = 'block';
    oharea.style.display = 'none';
}

obtn.onclick = onclickVideobtn;
oshut.onclick = closevideo;

function closevideo() {
    ovideo.style.display = 'none';
    var tracks = localStream.getTracks();
    tracks[0].stop();
    if (tracks[1]) { tracks[1].stop(); }
    vc.close();
    vc = null;
    videoInitiator = false;
}

function onclickVideobtn() {
    showVideo();
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream)
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });
    videoInitiator = true;
    exchangedata.type = "videocall";
    if (isInitiator) {
        sendChannel.send(JSON.stringify(exchangedata))
    } else {
        receiveChannel.send(JSON.stringify(exchangedata));
    }
}

function showVideo() {
    ovideo.style.display = 'block';
}

function ongetVideoCall() {
    showVideo();
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream)
        // .catch(function(e) {
        //     alert('getUserMedia() error: ' + e.name);
        // });
        //maybeStartVideo().then(answerVideo());

}


function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    console.log("LocalStream::::", localStream);
    localVideo.srcObject = stream;
    if (!videoInitiator) {
        maybeStartVideo();
        answerVideo();
    }

}

function createVideoConnection() {
    try {
        vc = new RTCPeerConnection(null);
        vc.onicecandidate = handleVideoIceCandidate;
        vc.onaddstream = handleRemoteStreamAdded;
        vc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created VideoConnnection');
    } catch (e) {
        console.log('Failed to create VideoConnection, exception: ' + e.message);
        alert('Cannot create VideoConnection object.');
        return;
    }
}

function answerVideo() {
    exchangedata.type = "videoanswer";
    if (isInitiator) {
        sendChannel.send(JSON.stringify(exchangedata))
    } else {
        receiveChannel.send(JSON.stringify(exchangedata));
    }
}

function maybeStartVideo() {
    createVideoConnection();
    vc.addStream(localStream);
    if (videoInitiator) {
        vc.createOffer(setLocalAndSendVideoOffer, handleCreateOfferError);
    }
}

function setLocalAndSendVideoOffer(sessionDescription) {
    vc.setLocalDescription(sessionDescription);
    exchangedata.type = "offer";
    exchangedata.data = JSON.stringify(sessionDescription);
    if (isInitiator) {
        sendChannel.send(JSON.stringify(exchangedata))
    } else {
        receiveChannel.send(JSON.stringify(exchangedata));
    }
    console.log("I send an video offer!!");
}

function setLocalAndSendVideoAnswer(sessionDescription) {
    vc.setLocalDescription(sessionDescription);
    exchangedata.type = "answer";
    exchangedata.data = JSON.stringify(sessionDescription);
    if (isInitiator) {
        sendChannel.send(JSON.stringify(exchangedata))
    } else {
        receiveChannel.send(JSON.stringify(exchangedata));
    }
    console.log("I send an video answer!!");
}

function handleVideoIceCandidate(event) {
    if (event.candidate) {
        let Cmessage = { "type": "candidate", "label": event.candidate.sdpMLineIndex, "id": event.candidate.sdpMid, "candidate": event.candidate.candidate };
        exchangedata.type = "candidate";
        exchangedata.data = JSON.stringify(Cmessage);
        if (isInitiator) {
            sendChannel.send(JSON.stringify(exchangedata))
        } else {
            receiveChannel.send(JSON.stringify(exchangedata));
        }
    } else {
        console.log("End of video candidate");
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////
//send picture


var sendpicture = document.getElementById("picture_btn");

sendpicture.onclick = picture_send;

function picture_send() {
    document.getElementById("findpicture").click();
    // var reader = new FileReader();
    // reader.onloadend = function() {
    //     console.log("Read file success!");

    // }

    var file = document.getElementById("findpicture").files[0];
    var reader = new FileReader();
    if (file) {
        //通过文件流将文件转换成Base64字符串
        reader.readAsDataURL(file);
        //转换成功后
        reader.onloadend = function() {
            console.log(reader.result);
            var localsaid = "<div class='send-box' id='send_box'> <div class='image'> <img src='images/kefu2.jpg' width='640' height='640' alt='kefu2'> </div> <div class='message'><img src=" + reader.result + " width='100' height='100' alt='picture'></div></div>";
            localsaid = localsaid.replace("\n", "<br>");
            chatbox.innerHTML = chatbox.innerHTML + localsaid;
            chatbox.scrollTop = chatbox.scrollHeight;
            exchangedata.type = "picture";
            exchangedata.data = reader.result;
            if (isInitiator) {
                sendChannel.send(JSON.stringify(exchangedata))
            } else {
                receiveChannel.send(JSON.stringify(exchangedata));
            }

        }
    } else {
        console.log("Read file error!");
    }
}



/////////////////////////////////////////////////
//Send File

var filepg = {
    type: "fileinfo",
    filename: "",
    filesize: "",
}

const bytes_per_chunk = 1200;
var fileSend;
var currentChunk;
var file = document.getElementById("findFile");
var sendfile = document.getElementById("file_btn");
var fileReader = new FileReader();

sendfile.onclick = function() {

    file.click();
    read_and_sendfile();
}

fileReader.onload = function() {

    if (isInitiator) {

        sendChannel.send(fileReader.result);
    } else {

        receiveChannel.send(fileReader.result);
    }
    currentChunk++;

}


function readNextChunk() {
    var start = bytes_per_chunk * currentChunk;
    var end = Math.min(fileSend.size, start + bytes_per_chunk);
    fileReader.readAsArrayBuffer(fileSend.slice(start, end));
}

function read_and_sendfile() {
    fileSend = file.files[0];
    if (fileSend) {
        currentChunk = 0;
        filepg.filename = fileSend.name;
        filepg.filesize = fileSend.size;
        if (isInitiator) {
            sendChannel.send(JSON.stringify(filepg))
        } else {
            receiveChannel.send(JSON.stringify(filepg));
        }
        // readNextChunk();

    } else {
        console.log("Read file error!");
    }

}

function startSendFile() {
    readNextChunk();
}

var receiveFile = {
    filename: "",
    filesize: ""
}
var incomingFileData;
var bytesReceived;
var downloadInProgress = false;
var receivecheck = false;
var downloadURL = document.getElementById('downloadURL');

function sendtoReceiveFile() {
    console.log("Wether to receive file?");
    var confirmCon = document.getElementById('freceive');
    confirmCon.style.display = 'block';
    if (isInitiator) {
        document.getElementById('uname').innerHTML = calleename;
    } else {
        document.getElementById('uname').innerHTML = callername;
    }
    document.getElementById('fname').innerHTML = "文件名：" + receiveFile.filename + "  文件大小：" + receiveFile.filesize;
    document.getElementById('recbtn').onclick = function() {

        exchangedata.type = "receiveFile";
        exchangedata.data = "1";
        if (isInitiator) {
            sendChannel.send(JSON.stringify(exchangedata))
        } else {
            receiveChannel.send(JSON.stringify(exchangedata));
        }
        confirmCon.style.display = 'none';
    }
    document.getElementById('rejbtn').onclick = function() {

        exchangedata.type = "receiveFile";
        exchangedata.data = " ";
        if (isInitiator) {
            sendChannel.send(JSON.stringify(exchangedata))
        } else {
            receiveChannel.send(JSON.stringify(exchangedata));
        }
        confirmCon.style.display = 'none';
    }
}

function downloadFile(data) {
    if (receivecheck === false) {
        startDownload(data);
        progressDownload(data);
    } else {
        progressDownload(data);
    }
}

function startDownload() {
    incomingFileData = [];
    bytesReceived = 0;
    receivecheck = true;
}

function progressDownload(data) {

    console.log("datapiece:", data);
    bytesReceived += data.byteLength;
    incomingFileData.push(data);
    console.log("progress:" + (bytesReceived / receiveFile.filesize));
    exchangedata.type = "getpiece";
    if (isInitiator) {
        sendChannel.send(JSON.stringify(exchangedata))
    } else {
        receiveChannel.send(JSON.stringify(exchangedata));
    }
    if (bytesReceived === receiveFile.filesize) {
        endDownload();
    }
}

function endDownload() {
    downloadInProgress = false;
    var blob = new window.Blob(incomingFileData);
    var anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = receiveFile.filename;
    anchor.textContent = "Download File";
    downloadURL.innerHTML = downloadURL.innerHTML + anchor;
    if (anchor.click) {
        anchor.click();
    } else {
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false);
        anchor.dispatchEvent(evt);
    }
    exchangedata.type = "endfile";
    exchangedata.data = "1";
    if (isInitiator) {
        sendChannel.send(JSON.stringify(exchangedata))
    } else {
        receiveChannel.send(JSON.stringify(exchangedata));
    }


}