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
     if(err) console.log(err);

     //Si no lo tengo, lo cargo del JSON que tengo que se llama config, se va a usar una sola vez.
     if(functions.isEmpty(resultado)){
       console.log("No se encuentra config en la base de datos, se crea.")

       //Este JSON se tiene que configurar dependiendo de la cuenta a la que va a acreditarse la plata
       config = require("./config.json");
       obj_config = {
         comment: config.comment,
         Public_Key: config.Public_Key,
         Access_Token: config.Access_Token,
         Client_id: config.Client_id,
         Client_secret: config.Client_secret
       }

       //Intento insertarlo en la base de datos.
       db.collection('mp_config').insertOne(obj_config, function(err, resp){
         if(err) console.log(err);
         else console.log("Config insertado en la base de datos.")
       });
     }
     else{
       //Logeo que obtengo la configuracion esperada.
       console.log(resultado);
       console.log("CLIENT SECRET: " + resultado[0].Client_secret);
       console.log("CLIENT ID: " + resultado[0].Client_id);

       //Instancio el objeto de MercadoPago con mis credenciales.
       var mp = new MP (resultado[0].Client_id, resultado[0].Client_secret);

       //Creo los objetos que tenemos que agregar al checkout.
       var last_checkout_id = randomstring.generate(20);
       var preference = {
               "checkout_id": last_checkout_id,
               "response_id": "",
               "items": [
                   {
                       "title": "Zapatilla 1",
                       "quantity": 1,
                       "currency_id": "ARG",
                       "unit_price": 100
                   },
                   {
                       "title": "Zapatilla 2",
                       "quantity": 1,
                       "currency_id": "ARG",
                       "unit_price": 200
                   },
                   {
                       "title": "Zapatilla 3",
                       "quantity": 2,
                       "currency_id": "ARG",
                       "unit_price": 300
                   },
               ]
           };

       //Primero lo inserto en la base de datos para ya almacenar el pedido de MercadoPago
       db.collection('mp_checkout_preference').insertOne(preference, function(err, resp){
         if(err) {
           console.log("Error en insert de checkout ");
           console.log(err);
         }
         else {
           console.log("Insert de Checkout Preference OK");
         }
       });

       //Una vez insertado, creo el checkout con los items correspondientes
       mp.createPreference (preference, function(err, resp){
         if(err) console.log("ERR> "+err);
         else {
           console.log("RESP> "+resp.response.id);
           console.log("RESP> "+resp.response.items[0].title);

           //Si se hizo correctamente, actualizo el response id para poder consultarlo despues.
           db.collection('mp_checkout_preference').update({checkout_id:last_checkout_id},{$set:{last_checkout_id:resp.response.id}},function(err,ret){
             if(err) {
               console.log("ERROR AL ACTUALIZAR last_checkout_id");
               console.log(err);
             }
             console.log("Actualizacion last_checkout_id OK");
             console.log(ret);
           });
        }
      });

      mp.post ({
                "uri": "/v1/payments",
                "data": payment_data});
     }
   })
   functions.closeIdleDb(db);
 }
});
