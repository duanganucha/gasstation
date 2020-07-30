const functions = require('firebase-functions');
const bodyParser = require('body-parser')
const request = require('request')
const express = require('express')
const cors = require('cors')
const app = express()
var moment = require('moment');

const { station_1 } = require('./station/station_1');
const { station_2 } = require('./station/station_2');
const { station_3 } = require('./station/station_3');
const { returnFunction } = require('./services/return');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// exports.helloWorld = functions.https.onRequest(async (req, res) => {

//     var returnValue = ''

//     // returnfunction = await station_1();

//     // station_2();
//     station_3();

//     returnValue = await returnFunction()

//     console.log({ time_server : returnValue })
//     setTimeout(() => {
//         return res.status(200).send({ time: returnValue });
//     }, 6000)

//     // return returnValue

// })



exports.scheduledFunction = functions.pubsub.schedule("* * * * *").timeZone('Asia/Bangkok').onRun(async (context) => {
   
    var returnValue = ''

    // returnfunction = await station_1();

    station_3();

    // station_2();


    returnValue = await returnFunction()

    console.log({ time_server : returnValue })
    // setTimeout(() => {
    //     return res.status(200).send({ time: returnValue });
    // }, 6000)

})



