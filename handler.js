const AWS = require("aws-sdk")
const lib = require("./helpers/lib.js")
const db = require("./helpers/db.js")
const moment = require("moment")
const bcrypt = require("bcrypt-nodejs")
const crypto = require("crypto")
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("338642092590-f7g5lkis0vim549ls358qvrdr8eb7g0j.apps.googleusercontent.com");

const tableName = "register";

module.exports.sample = function(event, context, callback) {
  var params = {
    Item : {
      "Id" : "1",
      "Name" : "Sujina"
    }
  };
  callback(null, lib.getResponse(200, { status: 200, message: "successfully rendered", item: params }) );
}

module.exports.register = function(event, context, callback){
  const user = JSON.parse(event.body);
  const confirm_token = crypto.randomBytes(32).toString('hex'); //random generated token
  var tableData = {
    Item: {
      email: user.email,
      encrypted_password: bcrypt.hashSync(user.password), //encrypting the password. Need custom hash.
      first_name: user.first_name,
      last_name: user.last_name,
      contact_number: user.contact_number,
      account_status: false,
      role: user.role,
      created_at: moment.utc().format(),
      upadted_at: moment.utc().format()
    },
    ConditionExpression: 'attribute_not_exists(email)', //Checking for unique entries.
    TableName: tableName
  };
  if(user.password != user.password_confimation){
    callback(null, lib.getResponse(422, { status: 422, error: "Password should match"}))
  } else {
    db.create(tableData, function(err, data){
      if(err){
        //If email already present..
        if(err.code == 'ConditionalCheckFailedException'){
          callback(null, lib.getResponse(422, {status: 422, message: "email already exsits"}));
        } else {
          callback(err, null);
        }
      }
      else{
        callback(null, lib.getResponse(200, {status: 200, message: "You have successfully signed up. Verification link has been sent to your email address."}));
      }
    })
  }
}

module.exports.sign_in_with_google = function(event, context, callback){
  const body = JSON.parse(event.body);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: body.token,
      audience: "338642092590-f7g5lkis0vim549ls358qvrdr8eb7g0j.apps.googleusercontent.com",  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    const domain = payload['hd'];
    if(domain === "qwinix.io") {
      const queryRow = {
        TableName: 'register',
        Key: {
          email: payload.email
        }
      };
      // if user not present, creat a user and session
      db.read(queryRow, function(err, data){ 
      //Querying db
        if(err){
          callback(err, null);
        }else if(data){
          const authentication_token = crypto.randomBytes(32).toString('hex'); //random generated token
          var params = {
            TableName: 'register',
            Key: {
            "email": payload.email
            },
            UpdateExpression: "set authentication_token = :authentication_token",
            ExpressionAttributeValues:{
              ":authentication_token": authentication_token
            },
            ReturnValues:"UPDATED_NEW"
          };

          db.update(params, function(err, updatedData){ //Updating user table
            if(err){
              console.log("any error after update call",err);
              callback(err, null);
            }else{
              console.log("updated attributes == ** ==", updatedData)
              var params = {
                authentication_token: authentication_token,
                email: payload.email
              }
              callback(null, lib.getResponse(200, { status: 200,message: "loggedin successfully", user: params}))
            }
          });
        }else{
          const authentication_token = crypto.randomBytes(32).toString('hex'); //random generated token
          var tableData = {
            Item: {
              email: payload.email,
              first_name: payload.given_name,
              last_name: payload.family_name,
              account_status: true,
              role: 'employee',
              created_at: moment.utc().format(),
              upadted_at: moment.utc().format()
            },
            TableName: tableName
          };
          db.create(tableData, function(err, data){
            if(err){
              callback(err, null);
            }
            else{
              var params = {
                authentication_token: authentication_token,
                email: payload.email
              }
              callback(null, lib.getResponse(200, {status: 200, message: "You have successfully loggedin.", user: params}));
            }
          })
        }
      });
    } else {
      callback(null, lib.getResponse(422, { status: false, error: "Invalid Email"}))
    }
  }
  verify().catch(console.error);
}

