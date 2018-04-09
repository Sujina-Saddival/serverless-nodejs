exports.getResponse = function(statusCode, body){
  return {
    statusCode: statusCode,
    "header": { "Access-Control-Allow-Origin" : "*", "Access-Control-Allow-Credentials" : true },
    "body": JSON.stringify(body)
  }
}
