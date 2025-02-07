const express = require("express");
const app = express();
const path = require('path');

app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});

// serve your css as static
//app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'www')));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//https://juejin.cn/post/7176971835047673916