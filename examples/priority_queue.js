// redis实现简单的优先级队列
const async = require('async');
const {redisClient} = require('../lib/redis');
const config = require('../config/config');

const conf = {
  url: `${config.redis.host}/${config.redis.port}`
};

function start(){
    producer();
    consumer();
}

const client = redisClient(conf, start);

// 优先级队列,低中高三个等级
const priorityQueues = ["queue_h", "queue_m", "queue_l"];

// 生产者
const producer = function() {
  function getRandomNum(min, max) {
      var range = max - min;
      var rand = Math.random();
      return(min + Math.round(rand * range));
  }

  // 每隔两秒产生10条数据,每条数据随机写入其中一个队列
  setInterval(function(){
      var count = 10;
      for (var i = 0; i < count; i++) {
          var idx = getRandomNum(0, 2);
          console.log("push: " + priorityQueues[idx]);
          client.lpush(priorityQueues[idx], "abc");
      }
  }, 2000);
};

// 消费者
const consumer = function() {
  function getMessage(){
    const funcs = priorityQueues.map((queue, index)=>{
      return function(callback){
        client.llen(priorityQueues[index], function(err, len){
          callback(null, len);
        });
      };
    });
    // 分别检查所有优先级队列中有没有数据

    async.parallel(
      funcs,
      function(err, results){
        if (err) {
          console.log(err);
          return;
        }
        for (var i = 0; i < results.length; i++){
          if (results[i] > 0){
            client.rpop(priorityQueues[i], function(err, res){
              console.log("pop: " + priorityQueues[i] + " " + res);
            });
            return;
          }
          if (i == 2){
            return;
          }
        }
      }
    );
  }

  // 每20ms获取一次数据
  setInterval(function(){
      getMessage();
  }, 20);
};
