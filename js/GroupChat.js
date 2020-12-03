var UserID;
var IDinDatabase;
var tmpfriendID; //临时查询所得的ID
var groupID;
var groupName;
var groupConList = new Array();
var groupAmount = 0;
var friendAndGroupList = document.getElementById('friendlist');
var originalList = friendAndGroupList.innerHTML;
var friendConList = new Array();
var friendAmount = 0;
var checkFriendMessage;
var checkGroupMessage;
var text_Send;
var isChatwithFriend = false;
var currentChatFriend;
var tmpfid; //最近聊天的好友
var currentChatGroup;
var tmpgid;
var chatConTmp = document.getElementById('chat_content'); //当前正在进行的聊天
var tmpChatCon;
var data_input = document.querySelector('textarea#data_input');
var groupMembersList = document.getElementById('groupmember');
var isLookingFriendList = true;

var name_input = "";
var add_interface = document.getElementById('add_interface').innerHTML;
var newFriendName = "";
var newFriendId = "";
var messageTable = new Array(); //记录未处理消息
messageTable[0] = 0; //未处理消息数量
var allMessageAmount = 0;

var pc;
var callerID;
var calleeID;
var callID;
var isInitiator;
var isInCall = false;
var localStream;
var localAudioStream;
var localVideoStream;
var remoteStream;
var remoteAudioStream;
var remoteVideoStream;
var localVideo = document.querySelector('video#localVideo');
var remoteVideo = document.querySelector('video#remoteVideo');
var isAudioOpen = false;
var isVideoOpen = false;
var sendChannel;
var receiveChannel;
var isConnected = false;
var pcConfig = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};
var firstOpenFriendList = true;
var firstOpenGroupList = true;
var firstOpenGroupMemberList = true;
var showMemberbtn = document.getElementById('groupnum');


var waitFrame_Caller = document.getElementById('video_interface');
var waitFrame_Callee = document.getElementById('vidrec_interface');
var obtn = document.getElementById('video_btn');
var ovideo = document.getElementById('mydialog');
var oshut = document.getElementById('hangupButton');


var hidebut = document.getElementById('hidebutton'); //用于最小化视频页面
var oharea = document.getElementById('hiddenarea');
var ohact = document.getElementById('hiddenact');


function checkID(elementID, friendBtnElement, groupBtnElement) {
    var ele = document.getElementById(elementID);
    var name = ele.value;
    if (name == '') {
        alert('Please input your id!');
    } else {
        var message = {
            'parameters': {
                'LogonID': name
            }
        };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message),
            type: "GET",
            dataType: 'json',
            success: function(data) {
                document.getElementById('login_interface').style.display = 'none';
                getUserID(name, friendBtnElement, groupBtnElement);
            },
            error: function() {
                console.log("Check ID Error!");
                alert('Please input the right id!');
            }
        });
    }
}

function getUserID(ID, e1, e2) {
    UserID = ID;
    console.log('Get user ID!', UserID);
    var message = { 'parameters': { 'LogonID': UserID } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            IDinDatabase = data;
        },
        error: function() {
            console.log("Check ID Error!");
        }
    });
    onOpenApp(e1, e2);
    document.getElementById('login_interface').style.display = 'none';
    showMemberbtn.style.display = 'none';
}

function getclientID(name) {
    var message = { 'parameters': { 'LogonID': name } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            tmpfriendID = data;
        },
        error: function() {
            console.log("Check ID Error!");
        }
    });
}

function getGroupID(group_name) {
    for (var i = 0; i < groupAmount; i++) {
        if (groupConList[i][0] === group_name) {
            tmpgid = groupConList[i][1];
            return groupConList[i][1];
        }
    }
}

function getGroupName(group_ID) {
    for (var i = 0; i < groupAmount; i++) {
        if (groupConList[i][1] === group_ID) {
            return groupConList[i][0];
        }
    }
}

function getFriendID(name) {
    for (var i = 0; i < friendAmount; i++) {
        if (friendConList[i][0] == name) {
            tmpfid = friendConList[i][1];
            return friendConList[i][1];
        }
    }
}

function getFriendName(ID) {
    for (var i = 0; i < friendAmount; i++) {
        if (friendConList[i][1] == ID) {
            return friendConList[i][0];
        }
    }
}

function getGroupChatRecordById(group_ID) {
    for (var i = 0; i < groupAmount; i++) {
        if (groupConList[i][1] === group_ID) {
            tmpChatCon = groupConList[i][2];
            return groupConList[i][2];
        }
    }
}

function addGroupChatRecordById(group_ID, message, bool) {
    var tmp = getGroupChatRecordById(group_ID);
    if (tmp == '' || tmp == undefined) {
        tmp = message;
    } else {
        tmp = tmp + message;
    }
    for (var i = 0; i < groupAmount; i++) {
        if (groupConList[i][1] === group_ID) {
            groupConList[i][2] = tmp;
        }
    }
    if (bool) {
        var tips = document.getElementById(currentChatGroup + "new");
        if (tips) {
            tips.style.display = 'none';
        }
        chatConTmp.innerHTML = tmp;
        chatConTmp.scrollTop = chatConTmp.scrollHeight; /*滚动条保持在底部 */
    }
}

function getFriendChatRecordById(ID) {
    for (var i = 0; i < friendAmount; i++) {
        if (friendConList[i][1] == ID) {
            tmpChatCon = friendConList[i][2];
            return friendConList[i][2];
        }
    }
}

function addFriendChatRecordById(ID, message, bool) {
    var tmp = getFriendChatRecordById(ID);
    if (tmp == '' || tmp == undefined) {
        tmp = message;
    } else {
        tmp = tmp + message;
    }
    for (var i = 0; i < friendAmount; i++) {
        if (friendConList[i][1] == ID) {
            friendConList[i][2] = tmp;
        }
    }
    if (bool) {
        var tips = document.getElementById(currentChatFriend + "new");
        if (tips) {
            tips.style.display = 'none';
        }
        chatConTmp.innerHTML = tmp;
        chatConTmp.scrollTop = chatConTmp.scrollHeight; /*滚动条保持在底部 */
    }
}

function showGroup(element1, element2) {
    console.log('Show groups!');
    isLookingFriendList = false;

    if (firstOpenGroupList) {
        //checkMessageFromGroup();
        var message = { "parameters": { "CallerName": UserID } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetGroups?id=' + JSON.stringify(message),
            type: "GET",
            dataType: 'json',
            success: function(data) {
                if (data.length < 1) {
                    console.log("You dont have a group!");
                } else {
                    firstOpenGroupList = false;
                    groupAmount = 0;
                    friendAndGroupList.innerHTML = originalList;
                    for (var i = 0; i < data.length; i++) {
                        groupAmount++;
                        groupConList[i] = new Array();
                        var groupname = data[i].groupName;
                        groupConList[i][0] = groupname; //Group name
                        groupConList[i][1] = data[i].groupID; //Group id
                        groupConList[i][2] = ""; //Group chat record
                        //groupConList[i][3] = false; //Group frame
                        var addGroupMsg = "<div class='fri_list' id = '" + groupname + "' onclick='onClickGroupName(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + groupname + "</div> <button class = 'newmesbtn' id='" + groupname + "new" + "' style='padding: 0; display: none;'>n</button> </div>";
                        addGroupMsg = addGroupMsg.replace("\n", "<br>");
                        friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addGroupMsg;
                    }

                }
                checkMessageFromGroup();
            },
            error: function() {
                console.log("Get groups Error!");
                groupConList[i] = new Array();
                friendAndGroupList.innerHTML = originalList;
                checkMessageFromGroup();
            }
        });
    } else {
        friendAndGroupList.innerHTML = originalList;
        for (var i = 0; i < groupAmount; i++) {
            var addGroupMsg = "<div class='fri_list' id = '" + groupConList[i][0] + "' onclick='onClickGroupName(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + groupConList[i][0] + "</div> <button class = 'newmesbtn' id='" + groupConList[i][0] + "new" + "' style='padding: 0; display: none;'>n</button> </div>";
            addGroupMsg = addGroupMsg.replace("\n", "<br>");
            friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addGroupMsg;
        }
        //checkMessageFromGroup();
    }
}


function showFriends(element1, element2) {
    document.getElementById(element1).style.backgroundColor = 'e5fbcf';

    console.log('First Show friends list!');
    isLookingFriendList = true;
    if (firstOpenFriendList) {
        //checkMessageFromFriend();
        var message = { "parameters": { "LogonID": UserID } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetFriends/?id=' + JSON.stringify(message),
            type: "POST",
            dataType: 'json',
            success: function(data) {
                if (data.root.row.length < 1) {
                    console.log("You dont have a friend!");
                } else {
                    friendAmount = 0;
                    friendAndGroupList.innerHTML = originalList;
                    console.log('Friend amount:', (data.root.row.length == undefined));
                    if (data.root.row.length == undefined) {
                        firstOpenFriendList = false;
                        var friendname = data.root.row.NickName;
                        friendAmount++;
                        friendConList[0] = new Array();
                        friendConList[0][0] = friendname; //Friend name
                        friendConList[0][1] = data.root.row.ID; //Friend ID
                        friendConList[0][2] = ""; //Chat record
                        var addFriendMsg = "<div class='fri_list' id = '" + data.root.row.Name + "' onclick='onClickFriendNameInList(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + friendname + "</div> <button class = 'newmesbtn' id='" + friendname + "new" + "' style='padding: 0; display: none;'>n</button></div>";
                        addFriendMsg = addFriendMsg.replace("\n", "<br>");
                        friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addFriendMsg;

                    } else {
                        for (var i = 0; i < data.root.row.length; i++) {
                            firstOpenFriendList = false;
                            var friendname = data.root.row[i].NickName;
                            friendAmount++;
                            friendConList[i] = new Array();
                            friendConList[i][0] = friendname; //Friend name
                            friendConList[i][1] = data.root.row[i].ID; //Friend ID
                            friendConList[i][2] = ""; //Chat record
                            var addFriendMsg = "<div class='fri_list' id = '" + data.root.row[i].Name + "' onclick='onClickFriendNameInList(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + friendname + "</div> <button class = 'newmesbtn' id='" + friendname + "new" + "' style='padding: 0; display: none;'>n</button></div>";
                            addFriendMsg = addFriendMsg.replace("\n", "<br>");
                            friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addFriendMsg;
                        }
                    }
                }
                checkMessageFromFriend();
            },
            error: function() {
                console.log("Get friends Error!");
                friendConList[i] = new Array();
                friendAndGroupList.innerHTML = originalList;
                checkMessageFromFriend();
            }
        });
    } else {
        console.log('Show friends list!');
        friendAndGroupList.innerHTML = originalList;
        for (var i = 0; i < friendAmount; i++) {
            var addFriendMsg = "<div class='fri_list' id = '" + friendConList[i][0] + "' onclick='onClickFriendNameInList(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + friendConList[i][0] + "</div> <button class = 'newmesbtn' id='" + friendConList[i][0] + "new" + "' style='padding: 0; display: none;'>n</button></div>";
            addFriendMsg = addFriendMsg.replace("\n", "<br>");
            friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addFriendMsg;
        }
        //checkMessageFromFriend();
    }

}

function showGroupMembers() {
    if (firstOpenGroupMemberList) {

        document.getElementById('groupmember').style.display = 'block';
        console.log('Show group members!');
        firstOpenGroupMemberList = false;
        var message = { "parameters": { "GroupID": getGroupID(currentChatGroup) } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallersByGroup?id=' + JSON.stringify(message),
            type: "GET",
            dataType: 'json',
            success: function(data) {
                groupMembersList.innerHTML = '';
                for (var i = 0; i < data.length; i++) {
                    var addFriendMsg;
                    var isMyFriend = false;
                    for (var j = 0; j < friendAmount; j++) {
                        if (friendConList[j][0] == data[i].cName) {
                            isMyFriend = true;
                        } else if (data[i].cName == UserID) {
                            isMyFriend = true;
                        }
                    }
                    if (isMyFriend) {
                        addFriendMsg = "<div class='frelist' id='frelist'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'> </div>   <div class='message'>" + data[i].cName + "</div> </div>";
                    } else {
                        addFriendMsg = "<div class='frelist' id='frelist'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'> </div>   <div class='message'>" + data[i].cName + "</div><button id='addbtn' value='" + data[i].cName + "' onclick='sendAddFriendMessage(this.value)'>+</button> </div>";
                    }
                    addFriendMsg = addFriendMsg.replace("\n", "<br>");
                    groupMembersList.innerHTML = groupMembersList.innerHTML + addFriendMsg;
                }
            },
            error: function() {
                console.log("Get group members Error!");
            }
        });
    } else {
        firstOpenGroupMemberList = true;
        document.getElementById('groupmember').style.display = 'none';
        groupMembersList.innerHTML = '';
    }
}

function onOpenApp(e1, e2) {
    showFriends(e1, e2);
    checkCalling();
    checkInvite();
}

function checkInvite() {
    setInterval(function() {
        var message = { "parameters": { "CallerID": IDinDatabase } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/PullInvites?id=' + JSON.stringify(message),
            type: "GET",
            dataType: 'json',
            success: function(data) {
                //如果有新消息则提示
                if (data.length < 1) {
                    //console.log("You dont have new invite!");
                } else {

                    for (var i = 0; i < data.length; i++) {
                        console.log('You got a invite message from' + data[i].senderName);
                        if (data[i].message == 'voiceChat') {
                            answerVoiceChat();
                        } else if (data[i].message == 'videoChat') {
                            callerID = data[i].senderName;
                            tmpfriendID = data[i].senderID;
                            waitFrame_Callee.style.display = 'block';
                            document.getElementById('callername').innerHTML = "您的好友 " + callerID;
                        } else if (data[i].message == 'addFriend') {
                            newFriendName = data[i].senderName;
                            newFriendId = data[i].senderID;
                            messageTable[0]++;
                            allMessageAmount++;
                            messageTable[messageTable[0]] = new Array();
                            messageTable[messageTable[0]][0] = newFriendId;
                            messageTable[messageTable[0]][1] = newFriendName;
                            messageTable[messageTable[0]][2] = 'addFriend';
                            messageTable[messageTable[0]][3] = false; //是否已处理
                            document.getElementById('inviteMessageTips').src = "images/new_message.jpg";
                            var addFriendInvite = document.getElementById('reqlist');
                            var addInvite = "<div class='frelist' id='inviterName" + data[i].senderName + "'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'> </div> <div class='message'>" + data[i].senderName + "</div> <button id='agreebtn' value='" + data[i].senderName + "' onclick='addFriend(this.value)'>接受</button> <button id='rejebtn' value='" + data[i].senderName + " onclick = 'refuseAddFriend(this.value)'>拒绝</button></div>";
                            addInvite = addInvite.replace("\n", "<br>");
                            addFriendInvite.innerHTML = addFriendInvite.innerHTML + addInvite;
                        } else if (data[i].message == 'answerVoiceChat') {
                            getVoiceChatAnswer();
                        } else if (data[i].message == 'answerVideoChat') {
                            getVideoChatAnswer(true);
                        } else if (data[i].message == 'agreeAddFriend') {
                            getAddFriendAnswer(true, data[i].senderName, data[i].senderID);
                        } else if (data[i].message == 'refuseChat') {
                            getVideoChatAnswer(false);
                            console.log('Your friend refuse to pick up!');
                        } else if (data[i].message == 'refuseAddFriend') {
                            getAddFriendAnswer(false, data[i].senderName, data[i].senderID);
                            console.log('Your friend rufuse to add you into the friend list!');
                        }
                        //  else if (data[i].message == 'closeAudio') {
                        //     closeRemoteAudio();
                        // } else if (data[i].message == 'closeVideo') {
                        //     closeRemoteVideo();
                        // } else if (data[i].message == 'openAllTracks') {

                        // } else if (data[i].message == 'openAudio') {

                        // } else if (data[i].message == 'openVideo') {

                        // } 
                        else if (data[i].message == 'hangup') {

                        } else {
                            console.log("Got a message from friend:", data[i].message);
                        }
                    }

                }
            },
            error: function() {
                console.log("Check invite message Error!");
            }
        });
    }, 1000);
}

function checkMessageFromFriend() {
    //clearInterval(checkGroupMessage);
    checkFriendMessage = setInterval(function() {
        var message = { "parameters": { "CallID": IDinDatabase } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/PullFriendMessages?id=' + JSON.stringify(message),
            type: "GET",
            dataType: 'json',
            success: function(data) {
                //如果有新消息则提示
                if (data.length < 1) {
                    console.log("You dont have new message!");
                } else {
                    for (var i = 0; i < data.length; i++) {
                        var tmp = "<div class='msg-box' id='message_box'><div class='image'><img src='images/arrow.jpg' width='640' height='640' alt='arrow'></div><div class='message'>" + data[i].message + "</div></div>";
                        tmp = tmp.replace("\n", "<br>");
                        //getFriendChatRecordById(data[i].senderID) = getFriendChatRecordById(data[i].senderID) + tmp;
                        if (isChatwithFriend & (currentChatFriend == getFriendName(data[i].senderID))) {
                            addFriendChatRecordById(data[i].senderID, tmp, true);
                        } else {
                            addFriendChatRecordById(data[i].senderID, tmp, false);
                            remindFriendMessage(data[i].senderID, true);
                        }
                        //remindFriendMessage(data[i].senderID, true);
                    }

                }
            },
            error: function() {
                console.log("Check friend message Error!");
            }
        });
    }, 1000);
}

function remindFriendMessage(ID, bool) {
    var tips = document.getElementById(getFriendName(ID) + "new");
    if (bool) {
        tips.style.display = 'block';
    } else {
        tips.style.display = 'none';
    }
}

function checkMessageFromGroup() {
    //clearInterval(checkFriendMessage);
    checkGroupMessage = setInterval(function() {
        var message = { "parameters": { "CallID": IDinDatabase } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/PullGroupMessages?id=' + JSON.stringify(message),
            type: "GET",
            dataType: 'json',
            success: function(data) {
                //如果有新消息则提示
                if (data.length < 1) {
                    console.log("You dont have new message!");
                } else {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].senderID != IDinDatabase) {
                            var tmp = "<div class='msg-box' id='message_box'><div class='image'><img src='images/arrow.jpg' width='640' height='640' alt='arrow'></div><div class='message'>" + data[i].message + "</div></div>";
                            tmp = tmp.replace("\n", "<br>");
                            // getGroupChatRecordById(data[i].groupID) = getGroupChatRecordById(data[i].groupID) + tmp;
                            if (!isChatwithFriend & (currentChatGroup == getGroupName(data[i].groupID))) {
                                addGroupChatRecordById(data[i].groupID, tmp, true);
                            } else {
                                addGroupChatRecordById(data[i].groupID, tmp, false);
                                remindGroupMessage(data[i].groupID, true);
                            }
                        }


                    }

                }
            },
            error: function() {
                console.log("Check group message Error!");
            }
        });
    }, 1000);
}

function remindGroupMessage(group_id, bool) { //提醒新消息
    var tips = document.getElementById(getGroupName(group_id) + "new");
    if (bool) {
        tips.style.display = 'block'
    } else {
        tips.style.display = 'none';
    }
}

function checkCalling() {
    var checkcalling = setInterval(function() {
        var message = { "parameters": { "CalleeName": UserID } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/BeingCalled/?id=' + JSON.stringify(message),
            type: "PUT",
            dataType: 'json',
            success: function(data) {
                if (data.root.Offer !== null) {
                    console.log("My friend is calling me!", data.root.Offer);
                    clearInterval(checkcalling);
                    callID = data.root.CallID;
                    ovideo.style.display = 'block';
                    createPeerConnection();
                    pc.ondatachannel = receiveChannelCallback;
                    navigator.mediaDevices.getUserMedia({
                            audio: true,
                            video: true
                        }).then(gotStream)
                        // .catch(function(e) {
                        //     alert('getUserMedia() error: ' + e.name);
                        // });
                    console.log('localstream:', localStream);
                    var tmpdescription = data.root.Offer;
                    console.log("CallID:" + callID + " Offer:", tmpdescription);
                    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(tmpdescription)));
                    // pc.createAnswer().then(setLocalAndSendAnswer,
                    //     onCreateAnswerError);
                    isConnected = true;

                }
            },
            error: function() {
                console.log("Checkcalling Error!");
            }
        });
    }, 3000);
}

function onClickFriendNameInList(calleeID) {
    //P2P CHAT
    if (isSearching) {
        document.getElementById('ser_interface').style.display = 'none';
        document.getElementById('ser_interface').innerHTML = "";
        isSearching = false;
    }
    showMemberbtn.style.display = 'none';
    currentChatFriend = calleeID;
    tmpfid = getFriendID(calleeID);
    isChatwithFriend = true;
    getFriendChatRecordById(tmpfid);
    if (tmpChatCon) {
        chatConTmp.innerHTML = tmpChatCon;
        var tips = document.getElementById(calleeID + "new");
        tips.style.display = 'none';
        chatConTmp.scrollTop = chatConTmp.scrollHeight; /*滚动条保持在底部 */
    } else {
        chatConTmp.innerHTML = '';
    }
    document.getElementById('show_name').innerHTML = currentChatFriend;


}

function onClickFriendNameInGroup(calleeID) {
    showMemberbtn.style.display = 'none';
    currentChatFriend = calleeID;
    isChatwithFriend = true;

}

function onClickGroupName(group_name) {
    if (isSearching) {
        document.getElementById('ser_interface').style.display = 'none';
        document.getElementById('ser_interface').innerHTML = "";
        isSearching = false;
    }
    //SHOW THE CHAT FRAME AND MESSAGE
    showMemberbtn.style.display = 'block';
    currentChatGroup = group_name;
    tmpgid = getGroupID(group_name);
    isChatwithFriend = false;
    getGroupChatRecordById(tmpgid);
    if (tmpChatCon) {
        chatConTmp.innerHTML = tmpChatCon;
        var tips = document.getElementById(group_name + "new");
        tips.style.display = 'none';
        chatConTmp.scrollTop = chatConTmp.scrollHeight; /*滚动条保持在底部 */
    } else {
        chatConTmp.innerHTML = '';
    }
    document.getElementById('show_name').innerHTML = currentChatGroup;



    firstOpenGroupMemberList = true;
    document.getElementById('groupmember').style.display = 'none';
    groupMembersList.innerHTML = '';
}



function sendMessage() { //绑定发送键
    if (data_input.value == '') {
        alert('Please input words!');
    } else {
        if (isChatwithFriend) {
            sendMessageToFriend(data_input.value);
            var tmp = "<div class='send-box' id='send_box'> <div class='image'> <img src='images/kefu2.jpg' width='640' height='640' alt='picture'> </div> <div class='message'>" + data_input.value + "</div> </div>";
            tmp = tmp.replace("\n", "<br>");

            addFriendChatRecordById(tmpfid, tmp, true);
            //chatConTmp.innerHTML = getFriendChatRecordById(getFriendChatRecordById(currentChatFriend));
        } else {
            sendMessageInGroup(data_input.value);
            var tmp = "<div class='send-box' id='send_box'> <div class='image'> <img src='images/kefu2.jpg' width='640' height='640' alt='picture'> </div> <div class='message'>" + data_input.value + "</div> </div>";
            tmp = tmp.replace("\n", "<br>");
            addGroupChatRecordById(tmpgid, tmp, true);
            //chatConTmp.innerHTML = getGroupChatRecordById(getGroupID(currentChatGroup));
        }
        data_input.value = '';
    }
}

function sendMessageInGroup(data) {
    var message = { "parameters": { "CallID": IDinDatabase, "GroupID": tmpgid, "Message": data } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/SendGroupMessage?value=' + JSON.stringify(message),
        type: "POST",
        dataType: 'json',
        success: function(data) {
            console.log('Send message success!');
        },
        error: function() {
            console.log("Send group message Error!");
        }
    });
}

function sendMessageToFriend(data) {
    var message = { "parameters": { "CallID": IDinDatabase, "FriendID": tmpfid, "Message": data } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/SendFriendMessage?value=' + JSON.stringify(message),
        type: "POST",
        dataType: 'json',
        success: function(data) {
            console.log('Send message success!');
        },
        error: function() {
            console.log("Send message to friend Error!");
        }
    });
}

function sendFileToFriend() {

}

function sendFileInGroup() {

}

function sendEmoji() {

}



//Add friend


function openFrame(id) {
    document.getElementById(id).innerHTML = add_interface;
    document.getElementById(id).style.display = "block";
}

function closeFrame(id) {
    document.getElementById(id).style.display = "none";
}

function searchUser(elementID) {
    var name = document.getElementById(elementID).value;
    var message = { 'parameters': { 'LogonID': name } };
    var addFrame = document.getElementById('add_interface');
    addFrame.innerHTML = add_interface;
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            var isfriend = false;
            for (var i = 0; i < friendAmount; i++) {
                if (friendConList[i][0] == name) {
                    isfriend = true;
                }
            }
            if (isfriend) {
                var addCallerInfo = "<div class='frelist' id='frelist'> <div class='image'>  <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + name + "</div>    </div>";
                addCallerInfo = addCallerInfo.replace("\n", "<br>");
                addFrame.innerHTML = addFrame.innerHTML + addCallerInfo;
            } else {
                var addCallerInfo = "<div class='frelist' id='frelist'> <div class='image'>  <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + name + "</div>   <button id='addbtn' value=" + name + " onclick='sendAddFriendMessage(this.value)'>+</button>    </div>";
                addCallerInfo = addCallerInfo.replace("\n", "<br>");
                addFrame.innerHTML = addFrame.innerHTML + addCallerInfo;
            }
        },
        error: function() {
            alert("Not Found!");
            console.log("Search ID Error!");
        }
    });

}

function searchGroup(elementID) {
    var name = document.getElementById(elementID).value;

}

function checkInviteMessage() {
    document.getElementById('beadd_interface').style.display = 'block';
}

function sendAddFriendMessage(name) {
    var message = { 'parameters': { 'LogonID': name } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            tmpfriendID = data;
            var tmessage = { "parameters": { "InviterID": IDinDatabase, "InviteeID": tmpfriendID, "Message": "addFriend" } };
            $.ajax({
                url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(tmessage),
                type: "POST",
                dataType: 'json',
                success: function() {
                    console.log('Send add friend request success!');
                },
                error: function() {
                    console.log("Send add friend request Error!");
                }
            });
        },
        error: function() {
            console.log("Check ID Error!");
        }
    });

}

function addFriend(name) {
    for (var i = 1; i <= allMessageAmount; i++) {
        if ((messageTable[i][1] == name) && (messageTable[i][2] == 'addFriend') && (!messageTable[i][3])) {
            document.getElementById("inviterName" + name).style.display = 'none';
            messageTable[0]--;
        }
    }
    if (messageTable[0] == 0) {
        document.getElementById('inviteMessageTips').src = "images/message.jpg";
    }
    var message0 = { 'parameters': { 'LogonID': name } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message0),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            var message = { "parameters": { "CallerID": IDinDatabase, "FriendID": data } };
            $.ajax({
                url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AddCallerFriend/?value=' + JSON.stringify(message),
                type: "POST",
                success: function() {
                    alert('Add friend success!');
                    console.log('Add friend success!');
                    friendConList[friendAmount] = new Array();
                    friendConList[friendAmount][0] = name; //Friend name
                    friendConList[friendAmount][1] = data; //Friend ID
                    friendConList[friendAmount][2] = ""; //Chat record
                    if (isLookingFriendList) {
                        var addFriendMsg = "<div class='fri_list' id = '" + newFriendName + "' onclick='onClickFriendNameInList(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + newFriendId + "</div> <button class = 'newmesbtn' id='" + newFriendId + "new" + "' style='padding: 0; display: none;'>n</button></div>";
                        addFriendMsg = addFriendMsg.replace("\n", "<br>");
                        friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addFriendMsg;
                    }
                    friendAmount++;
                    var message_send = { "parameters": { "InviterID": IDinDatabase, "InviteeID": newFriendId, "Message": "agreeAddFriend" } };
                    $.ajax({
                        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message_send),
                        type: "POST",
                        dataType: 'json',
                        success: function() {
                            console.log('Send add friend answer success!');
                        },
                        error: function() {
                            console.log("Send add friend answer Error!");
                        }
                    });
                },
                error: function() {
                    alert("Add friend Error!");
                    console.log("Add friend Error!");
                }
            });
        },
        error: function() {
            console.log("Check ID Error!");
        }
    });
    // var message = { "parameters": { "CallerID": IDinDatabase, "FriendID": newFriendId } };
    // $.ajax({
    //     url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AddCallerFriend/?value=' + JSON.stringify(message),
    //     type: "POST",
    //     success: function() {
    //         alert('Add friend success!');
    //         console.log('Add friend success!');
    //         friendConList[friendAmount] = new Array();
    //         friendConList[friendAmount][0] = newFriendName; //Friend name
    //         friendConList[friendAmount][1] = newFriendId; //Friend ID
    //         friendConList[friendAmount][2] = ""; //Chat record
    //         var addFriendMsg = "<div class='fri_list' id = '" + newFriendName + "' onclick='onClickFriendNameInList(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + newFriendId + "</div> <button class = 'newmesbtn' id='" + newFriendId + "new" + "' style='padding: 0; display: none;'>n</button></div>";
    //         addFriendMsg = addFriendMsg.replace("\n", "<br>");
    //         friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addFriendMsg;
    //         friendAmount++;
    //         var message_send = { "parameters": { "InviterID": IDinDatabase, "InviteeID": newFriendId, "Message": "agreeAddFriend" } };
    //         $.ajax({
    //             url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message_send),
    //             type: "POST",
    //             dataType: 'json',
    //             success: function() {
    //                 console.log('Send add friend answer success!');
    //             },
    //             error: function() {
    //                 console.log("Send add friend answer Error!");
    //             }
    //         });
    //     },
    //     error: function() {
    //         alert("Add friend Error!");
    //         console.log("Add friend Error!");
    //     }
    // });
    // var message_send = { "parameters": { "InviterID": IDinDatabase, "InviteeID": newFriendId, "Message": "agreeAddFriend" } };
    // $.ajax({
    //     url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message_send),
    //     type: "POST",
    //     dataType: 'json',
    //     success: function() {
    //         console.log('Send add friend answer success!');
    //     },
    //     error: function() {
    //         console.log("Send add friend answer Error!");
    //     }
    // });
}


function getAddFriendAnswer(bool, name, id) {
    if (bool) {
        alert("用户：" + name + "已添加您为好友，刷新页面显示");
        friendConList[friendAmount] = new Array();
        friendConList[friendAmount][0] = name; //Friend name
        friendConList[friendAmount][1] = id; //Friend ID
        friendConList[friendAmount][2] = ""; //Chat record
        if (isLookingFriendList) {
            var addFriendMsg = "<div class='fri_list' id = '" + name + "' onclick='onClickFriendNameInList(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div> <div class='message'>" + name + "</div> <button class = 'newmesbtn' id='" + name + "new" + "' style='padding: 0; display: none;'>n</button></div>";
            addFriendMsg = addFriendMsg.replace("\n", "<br>");
            friendAndGroupList.innerHTML = friendAndGroupList.innerHTML + addFriendMsg;
        }
        friendAmount++;
    } else {
        alert("用户：" + name + "拒绝添加您为好友");
    }
}

function refuseAddFriend(name) {
    for (var i = 1; i <= allMessageAmount; i++) {
        if ((messageTable[i][1] == name) && (messageTable[i][2] == 'addFriend') && (!messageTable[i][3])) {
            document.getElementById("inviterName" + name).style.display = 'none';
            messageTable[0]--;
        }
    }
    if (messageTable[0] == 0) {
        document.getElementById('inviteMessageTips').src = "images/message.jpg";
    }
    var message = { 'parameters': { 'LogonID': name } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            var message_send = { "parameters": { "InviterID": IDinDatabase, "InviteeID": data, "Message": "refuseAddFriend" } };
            $.ajax({
                url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message_send),
                type: "POST",
                dataType: 'json',
                success: function() {
                    console.log('Send add friend answer success!');
                },
                error: function() {
                    console.log("Send add friend answer Error!");
                }
            });
        },
        error: function() {
            console.log("Check ID Error!");
        }
    });
    // var message_send = { "parameters": { "InviterID": IDinDatabase, "InviteeID": newFriendId, "Message": "refuseAddFriend" } };
    // $.ajax({
    //     url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message_send),
    //     type: "POST",
    //     dataType: 'json',
    //     success: function() {
    //         console.log('Send add friend answer success!');
    //     },
    //     error: function() {
    //         console.log("Send add friend answer Error!");
    //     }
    // });
}






///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
function createGroup(group_name, description) {
    var message = { "parameters": { "GroupName": group_name, "Type": "Org", "CallerName": UserID, "GroupDescription": description } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AddGroup?value=' + JSON.stringify(message),
        type: "POST",
        dataType: 'json',
        success: function() {
            console.log('Create group success!');
        },
        error: function() {
            console.log("Create group Error!");
        }
    });
}
//Search friend or group

// function getNameByElementId(id) {
//     var element = document.getElementById(id);
//     name_input = element.value;

// }
var isSearching = false;

function findFriendorGroup(id1, id2) {
    isSearching = !isSearching;
    var searchResult = document.getElementById(id2);
    if (isSearching) {
        searchResult.innerHTML = "";
        searchResult.style.display = 'block';
        var alreadyFound = false;
        var element = document.getElementById(id1);
        name_input = element.value;
        for (var i = 0; i < friendAmount; i++) {
            if (friendConList[i][0] == name_input) {
                var result = "<div class='frelist' id = '" + name_input + "' onclick='onClickFriendNameInList(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div><div class='message'>" + name_input + "</div>  </div>"
                result = result.replace("\n", "<br>");
                searchResult.innerHTML = searchResult.innerHTML + result;
                alreadyFound = true;
            }
        }
        for (var i = 0; i < groupAmount; i++) {
            if (groupConList[i][0] == name_input) {
                var result = "<div class='frelist' id = '" + name_input + "' onclick='onClickGroupName(this.id)'> <div class='image'> <img src='images/arrow.jpg' width='640' height='640' alt='picture'>  </div><div class='message'>" + name_input + "</div>  </div>"
                result = result.replace("\n", "<br>");
                searchResult.innerHTML = searchResult.innerHTML + result;
                alreadyFound = true;
            }
        }
        if (!alreadyFound) {
            alert("Not found!");
        } else {
            element.value = "";
        }
    } else {
        searchResult.style.display = 'none';
        var element = document.getElementById(id1);
        element.value = "";

    }
}






//Video

hidebut.onclick = function() { //用于最小化视频页面
    ovideo.style.display = 'none';
    oharea.style.display = 'block';
}
ohact.onclick = function() { //用于还原视频页面
    ovideo.style.display = 'block';
    oharea.style.display = 'none';
}

// obtn.onclick = openVideoWindow;
oshut.onclick = hangupVideo;

function openVideoWindow(a, v) {
    // ovideo.style.display = 'block';
    waitFrame_Caller.style.display = 'block';
    document.getElementById('calleename').innerHTML = "正在向 " + currentChatFriend + " 拨打电话";
    //callFriend(a, v);
    var message = { 'parameters': { 'LogonID': currentChatFriend } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerID/?id=' + JSON.stringify(message),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            tmpfriendID = data;
            sendVideoChatRequest(currentChatFriend);
        },
        error: function() {
            console.log("Check ID Error!");
        }
    });
    // sendVideoChatRequest(currentChatFriend);
}

function callFriend(Audio, Video) {
    ovideo.style.display = 'block';
    callerID = UserID;
    clearInterval(checkCalling);
    isInitiator = true;
    createPeerConnection();
    navigator.mediaDevices.getUserMedia({
        audio: Audio,
        video: Video
    }).then(gotStream);
    // .catch(function(e) {
    //     alert('getUserMedia() error: ' + e.name);
    // });
    console.log('localstream:', localStream);
}

function sendVoiceChatRequest(name) {
    getclientID(name);
    var message = { "parameters": { "InviterID": IDinDatabase, "InviteeID": tmpfriendID, "Message": "voiceChat" } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message),
        type: "POST",
        dataType: 'json',
        success: function() {
            console.log('Send  request success!');
        },
        error: function() {
            console.log("Send  request Error!");
        }
    });
}

function answerVoiceChat(name, bool) {
    if (bool) {
        getclientID(name);
        var message = { "parameters": { "InviterID": IDinDatabase, "InviteeID": tmpfriendID, "Message": "answerVoiceChat" } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message),
            type: "POST",
            dataType: 'json',
            success: function() {
                console.log('Send request success!');
            },
            error: function() {
                console.log("Send request Error!");
            }
        });
    } else {
        getclientID(name);
        var message = { "parameters": { "InviterID": IDinDatabase, "InviteeID": tmpfriendID, "Message": "refuseVoiceChat" } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message),
            type: "POST",
            dataType: 'json',
            success: function() {
                console.log('Send request success!');
            },
            error: function() {
                console.log("Send request Error!");
            }
        });
    }
}

function getVoiceChatAnswer(bool) {
    if (bool) {
        callFriend(true, false);
    } else {
        console.log('Your friend does not want to have a voice chat with your right now!');
    }
}

function sendVideoChatRequest(name) {
    // getclientID(name);
    var message = { "parameters": { "InviterID": IDinDatabase, "InviteeID": tmpfriendID, "Message": "videoChat" } };
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message),
        type: "POST",
        dataType: 'json',
        success: function() {
            console.log('Send request success!');
        },
        error: function() {
            console.log("Send request Error!");
        }
    });
}

function answerVideoChat(bool) {
    waitFrame_Callee.style.display = 'none';
    if (bool) {
        // getclientID(callerID);
        var message = { "parameters": { "InviterID": IDinDatabase, "InviteeID": tmpfriendID, "Message": "answerVideoChat" } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message),
            type: "POST",
            dataType: 'json',
            success: function() {
                console.log('Send request success!');
            },
            error: function() {
                console.log("Send request Error!");
            }
        });
    } else {
        // getclientID(callerID);
        var message = { "parameters": { "InviterID": IDinDatabase, "InviteeID": tmpfriendID, "Message": "refuseVideoChat" } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/InviteFriend?value=' + JSON.stringify(message),
            type: "POST",
            dataType: 'json',
            success: function() {
                console.log('Send request success!');
            },
            error: function() {
                console.log("Send request Error!");
            }
        });
    }
}

function getVideoChatAnswer(bool) {
    waitFrame_Caller.style.display = 'none';
    if (bool) {
        callFriend(true, true);
    } else {
        alert('Your friend does not want to have a video chat with your right now!');
        console.log('Your friend does not want to have a video chat with your right now!');
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

function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    var tracks = localStream.getTracks();
    localAudioStream = tracks[0];
    localVideoStream = tracks[1];
    console.log("LocalStream::::", localStream);
    localVideo.srcObject = stream;
    if (isInitiator) {
        calleeID = currentChatFriend;
        pc.addStream(localStream);
        pc.createOffer(setLocalAndSendOffer, handleCreateOfferError);
    } else {
        pc.addStream(localStream);
        pc.createAnswer().then(setLocalAndSendAnswer,
            onCreateAnswerError);
    }
}

// function makeCall() {

//     calleeID = currentChatFriend;
//     pc.addStream(localStream);
//     pc.createOffer(setLocalAndSendOffer, handleCreateOfferError);
// }

function setLocalAndSendOffer(sessionDescription) {
    setDataChannel();
    pc.setLocalDescription(sessionDescription);

    var new_sessionDescription = JSON.stringify(sessionDescription);

    let message = { "parameters": { "CallerName": UserID, "CallerIP": "123:222:12:100:9867", "Offer": new_sessionDescription, "CalleeName": currentChatFriend } };

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
                waitAnswer();
            }

        },
        error: function() {
            console.log("Send offer Error!", JSON.stringify(message));
        }
    });
}

function handleCreateOfferError() {
    console.log('Create offer error!');
}

function setLocalAndSendAnswer(sessionDescription) {
    isInitiator = false;
    pc.setLocalDescription(sessionDescription);
    var new_sessionDescription = JSON.stringify(sessionDescription);
    let message = { "parameters": { "CallID": callID, "CalleeIP": "24:98:11:12:8765", "Answer": new_sessionDescription } };
    console.log('setLocalAndSendAnswer', message, sessionDescription);
    $.ajax({
        url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/AnswerCall',
        type: "PUT",
        headers: { 'Content-Type': 'application/json;charset=utf8' },
        data: JSON.stringify(message),
        dataType: 'text',
        success: function() {
            console.log("Send answer Success!");
            waitCallerCandidate();
        },
        error: function() {
            console.log("Send answer Error!");
        }
    });
}

function onCreateAnswerError() {
    console.log('Create answer error!');
}

function waitAnswer() {
    var wait_Answer = setInterval(function() {
        var message = { "parameters": { "CallID": callID } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/BeingAnswered/?id=' + JSON.stringify(message),
            type: "GET",
            dataType: 'json',
            success: function(data) {
                if (data.root.Answer !== null) {
                    console.log("Get Answer Success!");
                    var tmpdescription = data.root.Answer;
                    isConnected = true;
                    console.log("The answer is :", JSON.parse(tmpdescription));
                    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.root.Answer)));
                    clearInterval(wait_Answer);
                    waitCalleeCandidate();
                }
            },
            error: function() {
                console.log("Get Answer Error!");
            }
        });
    }, 1000)
}

function waitCallerCandidate() {
    var wait_CallerCandidate = setInterval(function() {
        var message = { "parameters": { "CallID": callID } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCallerCandidates/?id=' + JSON.stringify(message),
            type: "PUT",
            dataType: 'json',
            success: function(data) {
                if (data.root.CallerCandidates !== null) {
                    console.log("Get Caller Candidate Success!");
                    var tmpcandidate = JSON.parse(data.root.CallerCandidates);
                    //var tmpcandidate = data.root.CallerCandidates;
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: tmpcandidate.label,
                        candidate: tmpcandidate.candidate
                    });
                    pc.addIceCandidate(candidate);
                    clearInterval(wait_CallerCandidate);
                }
            },
            error: function() {
                console.log("Get Caller Candidate Error!");
            }
        });
    }, 1000)

}

function waitCalleeCandidate() {
    var wait_CalleeCandidate = setInterval(function() {
        var message = { "parameters": { "CallID": callID } };
        $.ajax({
            url: 'http://ebarter3d-prod.cn-north-1.eb.amazonaws.com.cn/api/Call/GetCalleeCandidates/?id=' + JSON.stringify(message),
            type: "PUT",
            dataType: 'json',
            success: function(data) {
                if (data.root.CalleeCandidates !== null) {
                    console.log("Get Callee Candidate Success!");
                    var tmpcandidate = JSON.parse(data.root.CalleeCandidates);
                    //var tmpcandidate = data.root.CalleeCandidates;
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: tmpcandidate.label,
                        candidate: tmpcandidate.candidate
                    });
                    pc.addIceCandidate(candidate);
                    clearInterval(wait_CalleeCandidate);
                }
            },
            error: function() {
                console.log("Get Callee Candidate Error!");
            }
        });
    }, 1000);
}

function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    var sendcandidates = setInterval(function() {
        if (event.candidate) {
            var Cmessage = { "type": "candidate", "label": event.candidate.sdpMLineIndex, "id": event.candidate.sdpMid, "candidate": event.candidate.candidate };
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

                        checkcalleecandidate = setInterval(waitCalleeCandidate, 3000);
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

                        checkcallercandidate = setInterval(waitCallerCandidate, 3000);
                    },
                    error: function() {
                        console.log("Send Callee Candidate Error!");
                    }
                });
            }
        } else {
            console.log('End of candidates.');
        }
    }, 3000)
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    var tracks = remoteStream.getTracks();
    remoteAudioStream = tracks[0];
    remoteVideoStream = tracks[1];
    remoteVideo.srcObject = remoteStream;
    console.log(tracks.remote);
    isInCall = true;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function setDataChannel() {
    sendChannel = pc.createDataChannel('sendDataChannel', null);
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;
    sendChannel.onmessage = onReceiveMessage;
}

function onSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    console.log('Send channel state is: ' + readyState);
    // if (readyState === 'open') {
    //     alreadyConnected = true;
    //     dataChannelSend.disabled = false;
    //     dataChannelSend.focus();
    //     sendButton.disabled = false;

    // } else {
    //     dataChannelSend.disabled = true;
    //     sendButton.disabled = true;

    // }
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
    // if (readyState === 'open') {
    //     alreadyConnected = true;
    //     dataChannelSend.disabled = false;
    //     dataChannelSend.focus();
    //     sendButton.disabled = false;

    // } else {
    //     dataChannelSend.disabled = true;
    //     sendButton.disabled = true;

    // }
}

function changeMediaStream() {

}

function sendMediaMessage(message) {
    if (isInitiator) {
        sendChannel.send(message);
    } else {
        receiveChannel.send(message);
    }
}

function onReceiveMessage(message) {
    //Using to control stream 
    if (message == 'close') {
        hangupVideo();
    } else if (message == 'onlycloseaudio') {
        remoteVideo.srcObject = remoteVideoStream;
    } else if (message == 'onlyopenaudio') {
        remoteVideo.srcObject = remoteAudioStream;
    } else if (message == 'onlyclosevideo') {
        remoteVideo.srcObject = remoteAudioStream;
    } else if (message == 'onlyopenvideo') {
        remoteVideo.srcObject = remoteVideoStream;
    } else if (message == 'closeall') {
        remoteVideo.srcObject = null;
    } else if (message == 'openall') {
        remoteVideo.srcObject = remoteStream;
    } else {
        console.log('Message is:', message);
    }
}

if (location.hostname !== 'localhost') {
    requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    );
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

function hangupVideo() {
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
    isInCall = false;
}

function stop() {
    ovideo.style.display = 'none';
    localVideo = null;
    remoteVideo = null;
    pc.close();
    pc = null;
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