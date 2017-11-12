var MP = require ("mercadopago");
var MongoClient = require('mongodb').MongoClient;
var config;
var functions = require('./functions.js');
var randomstring = require("randomstring");


//Opciones de conexion a la base de datos
var options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};

//URL de conexion a la base de datos.
//var uri = "mongodb://admin:UfEisHW8rEzt4WTc@desarrollo-shard-00-00-2pshm.mongodb.net:27017,desarrollo-shard-00-01-2pshm.mongodb.net:27017,desarrollo-shard-00-02-2pshm.mongodb.net:27017/test?ssl=true&replicaSet=Desarrollo-shard-0&authSource=admin";
var uri = "mongodb://CON089/Aquosa";

//Conexion a la base de datos posta.
MongoClient.connect(uri,options, function(err, db) {
 if(err){
   throw err;
 }
 else {
   console.log("Conexion OK a Base de Datos");
   //Busco en la coleccion de la configuracion de MercadoPago la configuracion.
   db.collection('mp_config').find({}).toArray(function(err, resultado){

    //Logeo que obtengo la configuracion esperada.
    console.log(resultado);
    console.log("CLIENT SECRET: " + resultado[0].Client_secret);
    console.log("CLIENT ID: " + resultado[0].Client_id);

    //Instancio el objeto de MercadoPago con mis credenciales.
    var mp = new MP (resultado[0].Client_id, resultado[0].Client_secret);

    var data = {
            "card_number": "5031755734530604",
            "security_code": "123",
            "expiration_month": 4,
            "expiration_year": 2020,
            "cardholder": {
                "name": "APRO",
                "identification": {
                    "subtype": null,
                    "number": "12345678",
                    "type": "DNI"
                }
            }
        };

    var request = {
        "uri": "/v1/card_tokens",
        "params": {
            "public_key": resultado[0].Public_Key
        },
        "data": data,
        "authenticate": false
    };

    mp.post(request,function(err, cardtoken) {
      if(err) console.log(err);
      console.log(cardtoken);
      var data = {
      	            "token": cardtoken.response.id,
      	            "description": "Payment test",
      	            "transaction_amount": 154.9,
      	            "payment_method_id": "master",
      	            "payer": {
      	                "email": "test@localsdk.com"
      	            },
      	            "installments": 9
      	        };

      var request = {
          "uri": "/v1/payments",
          "params": {
              "access_token": resultado[0].Access_Token
          },
          "data": data,
          "headers": {
              "x-idempotency-key": "sdk-test-idempotency-dummy-key"
          },
          "authenticate": false
      };

        mp.post(request, function(err, resp_pago){
          if(err) console.log(err);
          console.log(resp_pago);
        });
    });




  });
  }
});
