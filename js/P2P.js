'use strict';






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
    video: true
};
if (location.hostname !== 'localhost') {
    requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    );
}
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');


var Videobtn = document.querySelector('button#VideoChatButton');
var Answerbtn = document.querySelector('button#answerVideoButton');
var Hangupbtn = document.querySelector('button#hangupButton');

Videobtn.onclick = videochat;

Answerbtn.onclick = answer;

Hangupbtn.onclick = hangup;



function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    console.log("LocalStream::::", localStream);
    localVideo.srcObject = stream;
    VmaybeStart();

}

var checkanswer;

function VmaybeStart() {
    console.log('>>>>>>> VmaybeStart() ', isStarted, localStream);
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

    if (!isStarted) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
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
        sendcandidates = setInterval(function() {
            if (isInitiator & isConnected) {
                var message = { "parameters": { "CallID": new_callID, "CallerCandidates": JSON.stringify(Cmessage) } };
                console.log("CallerCandidates is:", message);
                console.log("After Stringify:", JSON.stringify(message));
                $.ajax({
                    url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AddCallerCandidates',
                    type: "PUT",
                    dataType: 'text',
                    headers: { 'Content-Type': 'application/json;charset=utf8' },
                    data: JSON.stringify(message),

                    success: function() {
                        console.log("Send Caller Candidate Success!");
                        //clearInterval(sendcandidates);
                        checkcalleecandidate = setInterval(seecalleecandidate, 3000);
                    },


                    error: function() {
                        console.log("Send Caller Candidate Error!");
                    }
                });
            } else {
                var message = { "parameters": { "CallID": new_callID, "CalleeCandidates": JSON.stringify(Cmessage) } };
                console.log("CalleeCandidates is:", message);
                console.log("After Stringify:", JSON.stringify(message));
                $.ajax({
                    url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AddCalleeCandidates',
                    type: "PUT",
                    data: JSON.stringify(message),

                    dataType: 'text',
                    headers: { 'Content-Type': 'application/json;charset=utf8' },
                    success: function() {
                        console.log("Send Callee Candidate Success!");
                        //clearInterval(sendcandidates);
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
        clearInterval(sendcandidates);
    }
}

function seecalleecandidate() {
    var message = { "parameters": { "CallID": new_callID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCalleeCandidates/?id=' + JSON.stringify(message),
        type: "PUT",
        dataType: 'json',
        success: function(data) {
            if (data.root.CalleeCandidates !== null) {
                console.log("Get Callee Candidate Success!");
                //var tmpcandidate = JSON.parse(data.root.CalleeCandidates);
                var tmpcandidate = JSON.parse(data.root.CalleeCandidates);
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
    var message = { "parameters": { "CallID": new_callID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerCandidates/?id=' + JSON.stringify(message),
        type: "PUT",
        dataType: 'json',
        success: function(data) {
            if (data.root.CallerCandidates !== null) {
                console.log("Get Caller Candidate Success!");
                //var tmpcandidate = JSON.parse(data.root.CallerCandidates);
                var tmpcandidate = JSON.parse(data.root.CallerCandidates);
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

function videochat() {
    isInitiator = true;
    Sender = true;
    navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        }).then(gotStream)
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });
    console.log('localstream:', localStream);

}

function sendoffer() {
    pc.createOffer(setLocalAndSendOffer, handleCreateOfferError);

}

function setLocalAndSendOffer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log("SessionDescription: ", sessionDescription);

    var new_sessionDescription = JSON.stringify(sessionDescription);
    // new_sessionDescription = new_sessionDescription.replace(/"/g, "\"");
    // new_sessionDescription = new_sessionDescription.replace(/'/g, "\'");
    // new_sessionDescription = new_sessionDescription.replace(/\n/g, "\\n");
    // new_sessionDescription = new_sessionDescription.replace(/\"/g, "\\\"");
    // new_sessionDescription = new_sessionDescription.replace(/\'/g, "\\\'");
    // new_sessionDescription = new_sessionDescription.replace(/\\n/g, "\\\\n");
    console.log(new_sessionDescription);
    console.log(JSON.stringify(new_sessionDescription));
    //var message = '{ "parameters": { "CallerName": "AA", "CallerIP": "123:222:12:100:9867", "Offer": ' + '"' + new_sessionDescription + '"' + ', "CalleeName": "BB" } }';

    let message = { "parameters": { "CallerName": "AA", "CallerIP": "123:222:12:100:9867", "Offer": new_sessionDescription, "CalleeName": "BB" } };

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
                new_callID = data.root.ID;
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
    var message = { "parameters": { "CallID": new_callID } };
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
}




function answer() {
    navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        }).then(gotStream)
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });
    var checkcalling = setInterval(function() {
        var message = { "parameters": { "CalleeName": calleename } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/BeingCalled/?id=' + JSON.stringify(message),
            type: "PUT",
            dataType: 'json',
            success: function(data) {
                if (data.root.Offer !== "") {
                    console.log("My friend is calling me!");
                    new_callID = data.root.CallID;
                    callerIP = data.root.CallerIP;
                    var tmpdescription = data.root.Offer;
                    console.log("CallID:" + new_callID + " Offer:", tmpdescription);
                    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(tmpdescription)));
                    clearInterval(checkcalling);
                    pc.createAnswer().then(sendanswer,
                        onCreateSessionDescriptionError);
                    VmaybeStart();

                }
            },
            error: function() {
                console.log("Checkcalling Error!");
            }
        });
    }, 3000);

}

function sendanswer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    var new_sessionDescription = JSON.stringify(sessionDescription);
    let message = { "parameters": { "CallID": new_callID, "CalleeIP": "24:98:11:12:8765", "Answer": new_sessionDescription } };
    console.log('setLocalAndSendAnswer', message);
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AnswerCall',
        type: "PUT",
        headers: { 'Content-Type': 'application/json;charset=utf8' },
        data: JSON.stringify(message),
        dataType: 'text',
        success: function() {
            console.log("Send answer Success!", JSON.stringify(message));
        },
        error: function() {
            console.log("Send answer Error!");
        }
    });
}


function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
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
    var message = { "parameters": { "CallID": new_callID } };
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
}