const AWS = require("aws-sdk");

AWS.config.update({
    accessKeyId: "AKIAJE7WM6GSU72DRSGA",
    secretAccessKey: "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",
    region: "ap-south-1"
    // endpoint: 'http://localhost:8000'
});

var dynamo = new AWS.DynamoDB.DocumentClient();

exports.create = function(tableData, callback){
  dynamo.put(tableData, function(err, data) {
      if (err) {
          console.log("tableData err", err);
          callback(err, null);
      } else {
          callback(null, data);
      }
  });
}

exports.read = function(tableData, callback){
  dynamo.get(tableData, function(err, data){
    if(err){
      callback(err, null);
    }else{
      callback(null, data);
    }
  });
}

exports.update = function(tableData, callback){
  dynamo.update(tableData, function(err, data){
    if(err){
      callback(err, null);
    }else{
      callback(null, data);
    }
  });
}

