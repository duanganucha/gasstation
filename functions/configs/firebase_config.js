
'use strict';

var admin = require("firebase-admin");

var serviceAccount = require("./../services/serviceAccountKey2.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gasstation-ea536.firebaseio.com"
});

const db = admin.firestore();

module.exports = db;


//ttt