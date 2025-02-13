var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');

var app = express();
var config = null;
var robot_list= new Array();
const path = require('path');
var io = require('../node_modules/socket.io/node_modules/socket.io-client');

//设置跨域访问
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1');
	//res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

//生成从minNum到maxNum的随机数
function randomNum(minNum,maxNum){ 
  switch(arguments.length){ 
      case 1: 
          return parseInt(Math.random()*minNum+1,10); 
      break; 
      case 2: 
          return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10); 
      break; 
          default: 
              return 0; 
          break; 
  } 
} 

function generateRandomName() {
  // 复姓列表
  const compoundSurnames = [
    '欧阳', '上官', '司徒', '司马', '诸葛', 
    '公孙', '东方', '南宫', '慕容', '皇甫',
    '尉迟', '长孙', '宇文', '独孤', '夏侯'
  ];

  // 名字常用字（可自行扩展）
  const nameCharacters = [
    '子', '文', '晓', '雨', '梦', '宇', '晨', '欣', '俊', '雅',
    '飞', '翔', '明', '华', '杰', '宁', '慧', '婷', '磊', '强',
    '超', '波', '敏', '静', '伟', '芳', '娜', '琳', '洋', '鑫',
    '鹏', '旭', '凯', '宏', '瑞', '雪', '月', '阳', '博', '思',
    '清', '云', '海', '天', '若', '之', '安', '平', '乐', '浩'
  ];

  // 随机选择复姓
  const surname = compoundSurnames[Math.floor(Math.random() * compoundSurnames.length)];
  
  // 随机生成两个名字字
  const characters = [
    nameCharacters[Math.floor(Math.random() * nameCharacters.length)],
    nameCharacters[Math.floor(Math.random() * nameCharacters.length)]
  ];

  return surname + characters.join('');
}

function generateRandomRoleName() {
  var names = [
    "上官",
    "欧阳",
    "东方",
    "端木",
    "独孤",
    "司马",
    "南宫",
    "夏侯",
    "诸葛",
    "皇甫",
    "长孙",
    "宇文",
    "轩辕",
    "东郭",
    "子车",
    "东阳",
    "子言",
  ];

  var names2 = [
    "雀圣",
    "赌侠",
    "赌圣",
    "稳赢",
    "不输",
    "好运",
    "自摸",
    "有钱",
    "土豪",
  ];
  var idx = Math.floor(Math.random() * (names.length - 1));
  var idx2 = Math.floor(Math.random() * (names2.length - 1));
  return names[idx] + names2[idx2];
}

app.use(express.static(path.join(__dirname, 'public')));

 
app.get('/', function (req, res) {
  res.header("Content-Type", "text/html;charset=utf-8");
   res.sendFile(path.join(__dirname, 'index.html'));
})
 
app.get('/process_get', function (req, res) {
	 res.header("Content-Type", "application/json;charset=utf-8");
   // 输出 JSON 格式
  //  var response = {
  //      "first_name":req.query.first_name,
  //      "last_name":req.query.last_name
  //  };
  //  console.log(response);
  //  res.end(JSON.stringify(response));
  
   try_enter_private_room(req.query.first_name,req.query.last_name,function(ret) {
    if(ret){
      http.send(res,0,"success");
      //进入房间成功再尝试登入游戏服
    }else{
      http.send(res,-1,"opertion fail!!");
    }
   });
})

//http://127.0.0.1:9004/add_game_robot?roomid=123&robot_num=456
app.get('/add_game_robot',function(req,res){
  var data = req.query;
  var roomId = data.roomid;
  var robot_num = data.robot_num;
  if(roomId == null || robot_num == null){
    http.send(res,-1,"invalid parameters roomId: "+ roomId + " robot_num: " +robot_num);
    return;
  }
  
  for (var i = 0; i < robot_num; ++i) {
    //选取机器人数据尝试登入房间
    robot_list[i];
  }
  http.send(res,0,"success");
});

// app.get('/kick_robot',function(req,res){

// });

function init_robot_list(callback) {
  db.get_all_robot_data(function(robots_data) {
    if(robots_data==null||robots_data.length<=0){
      callback(false);
      return;
    }
    //初始化机器人列表 
    robot_list = robots_data;
    for (var i = 0; i < robot_list.length; i++) {
      console.log("init robot userid: " +robot_list[i].userid + " account: "+robot_list[i].account +" name: " + robot_list[i].name);
    }
    console.log("init total robot num: "+ robot_list.length);
    callback(true);
  });
};


function create_robot(account,name,sex,headimgurl,callback){
  var coins = 1000;
  var gems = 21;
  db.is_user_exist(account,function(ret){
    if(!ret){
      db.create_robot(account,name,coins,gems,sex,headimgurl,function(ret){
        callback();
      });
    }
  });
};

function generateAccountId() {
  var Id = "";
  for (var i = 0; i < 6; ++i) {
      if (i > 0) {
          Id += Math.floor(Math.random() * 10);
      } else {
          Id += Math.floor(Math.random() * 9) + 1;
      }
  }
  return Id;
}

//reigster机器人
function reigster_robot(reigster_num) {
  for (var i = 0; i < reigster_num; i++) {
    var account = "robot_" + generateAccountId();
    var name = generateRandomRoleName();
    var sex = Math.round(Math.random());
    var headimgurl = null;
    create_robot(account, name, sex, headimgurl, function(){
      console.log("creater robot " + name)
    });
  }
};

function try_enter_private_room(roomid,robot_num, callback){
  for(var i =0;i<robot_num;i++){
    var robot = robot_list[i];
    robot_enter_private_room(roomid,robot,callback);
  }
}

function robot_enter_private_room(roomid,robot,callback) {
  var ip = "127.0.0.1";
  var port = 9001;
  var path="/enter_private_room";
  
  var reqdata = {
    account: robot.account,
    sign: "dcffce196d649eaa6c1108adde23f700",
    roomid:roomid
  };
  //reqdata.sign = crypto.md5(userId + roomConf + data.gems + config.ROOM_PRI_KEY);
  http.get(ip, port, path, reqdata, function (ret, data) {
    console.log(data);
    if (ret) {
      if (data.errcode == 0) {
        console.log("enter_private_room succ!!");
        try_login_game(data,function (ret) {
          if(ret){
            callback(true);
          }else{
            callback(false);
          }
        });
      }else {
        console.log("enter_private_room fail!! errcode: " + data.errcode);
        callback(false);
      }
    }else{
      console.log("enter_private_room req failed!!");
      callback(false);
    }
  });
};

function try_login_game(gamedata) {
  var reqdata = {
    roomid:gamedata.roomid,
    token: gamedata.token,
    time:gamedata.time,
    sign:gamedata.sign
  };
  //客户端发送请求

  var socket = io('http://'+gamedata.ip+':'+ gamedata.port+'/');
  // 监听连接成功事件
  socket.on('connect', () => {
    console.log('已连接到服务端');

    socket.emit('login',JSON.stringify(reqdata));

    // 监听服务端发送的消息（假设服务端会发送 'message' 事件）
    socket.on('login_result', (data) => {
      //console.log('login_result:', data);
      if(data.errcode!=0){
        console.log('login game fail!!');
      }
    });

    socket.on('login_finished', (data) => {
      console.log('login_finished:');
    });
    //手牌
    socket.on('game_holds_push', (data) => {
      console.log('game_holds_push:');
    });

    //剩下的牌
    socket.on('mj_count_push', (data) => {
      console.log('mj_count_push:');
    });
    //
    //定缺
    socket.on('game_dingque_push', (data) => {
      console.log('game_dingque_push:'+ data);

      socket.emit('dingque',randomNum(0,2));
    });
    //出牌
    socket.on('game_chupai_push', (data) => {
      console.log('game_chupai_push:'+ data);
    });
    // 监听断开连接事件
    socket.on('disconnect', () => {
      console.log('与服务端断开连接');
    });
  });
};

exports.start = function($config){
  //reigster_robot(1);
  init_robot_list(function(ret){
    if(!ret){
      console.log("init robot list fail!!!");
    }else{
      config = $config;
      app.listen(config.ROBOT_PORT);
      console.log("robot service is listening on port " + config.ROBOT_PORT);    
    }
  });
};

//http://10.91.42.45:9000/guest?account=1738747743636
//http://127.0.0.1:9001/login?account=guest_1738747743636&sign=5b26de053d29d6acaa7b78c826c2b74d

//[http://127.0.0.1:9001/enter_private_room?account=guest_asdf1&sign=dcffce196d649eaa6c1108adde23f700&roomid=418433]