var robot_service = require("./robot_service");

var configs = require(process.argv[2]);
var config = configs.robot_server();

var db = require('../utils/db');
db.init(configs.mysql());

robot_service.start(config);
//打开http://localhost:9004/访问控制页面