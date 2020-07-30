const functions = require('firebase-functions');
const bodyParser = require('body-parser')
const request = require('request')
const express = require('express')
const cors = require('cors')
const app = express()
var moment = require('moment');

const { fetchDataDelivery, fetchDataAlarm } = require('./services/database_1');
const { fetchFirebaseDelivery, updateDateFirebaseDelivery, fetchFirebaseAlarm, updateDateFirebaseAlarm, } = require('./services/firebase');

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// exports.helloWorld = functions.https.onRequest((request, response) => {
//     response.send("Hello from waiwai!");
// });

var counter = 0 
exports.scheduledFunction = functions.pubsub.schedule("* * * * *").timeZone('Asia/Bangkok').onRun((context) => {
    console.log({ counter : counter })
   return counter += 1;
})



const current_time = ''
app.get('/time', (req, res) => {
    current_time = moment().utcOffset(7)
    current_time = current_time.format('h:mm')
    res.json({ current_time })
})

app.get('/delivery', async (req, res) => {
    console.log({ server: 'connect api delivery' })
    // res.send({ response: 'connect api ปั้มน้ำมัน Service' })

    const tank = [1, 2]
    responseArray = []
    try {

        for (let index = 0; index < tank.length; index++) {
            console.log('tank id : ' + tank[index])
            const tank_id_database = tank[index];
            const tank_id_firebase = `tank_id_${tank[index]}`

            const dateEndDataBase = await fetchDataDelivery(tank_id_database)
            var lastDateDelivery = dateEndDataBase.end_dlv
            console.log({ delivery: lastDateDelivery })
            // lastDateDelivery = moment(lastDateDelivery).utcOffset(7)
            lastDateDelivery = `${lastDateDelivery}`
            console.log({ delivery: lastDateDelivery })

            const getFirebase = await fetchFirebaseDelivery(tank_id_firebase)
            // console.log({ firebase: getFirebase })
            const lastDateFirebase = (getFirebase.date_end)
            console.log({ firebase: lastDateFirebase })

            var check = (`${lastDateDelivery}` == lastDateFirebase)
            if (check == false) {
                try {
                    const update = await updateDateFirebaseDelivery(tank_id_firebase, lastDateDelivery);
                    console.log('Send data to Line group. Data is change. ...tank id : ' + tank[index])
                    sendLine(dateEndDataBase);
                    responseArray.push('Send data to Line group. Data is change. ...tank id : ' + tank[index])
                }
                catch (ex) { res.status(500).json({ message: ex.message }) }

            } else {
                console.log('Not sent line.Becourse data not change...tank id : ' + tank[index])
                responseArray.push('Not sent line.Becourse data not change...tank id : ' + tank[index])
            }

        }
        res.json(responseArray)

    }
    catch (ex) { res.status(500).json({ message: ex.message }) }


})

app.get('/summary_23_59', async (req, res) => {
    console.log({ server: 'connect api summary_23_59' })
    // res.send({ response: 'connect api ปั้มน้ำมัน Service' })

    const tank = [1, 2]
    const dataSummary = []
    for (let index = 0; index < tank.length; index++) {
        console.log('tank id : ' + tank[index])
        const tank_id_database = tank[index];
        const tank_id_firebase = `tank_id_${tank[index]}`

        try {

            const dateEndDataBase = await fetchDataDelivery(tank_id_database)
            var lastDateDelivery = dateEndDataBase.end_dlv
            console.log({ delivery: lastDateDelivery })
            // lastDateDelivery = moment(lastDateDelivery).utcOffset(7)
            lastDateDelivery = `${lastDateDelivery}`
            console.log({ delivery: lastDateDelivery })

            const getFirebase = await fetchFirebaseDelivery(tank_id_firebase)
            // console.log({ firebase: getFirebase })
            const lastDateFirebase = (getFirebase.date_end)
            console.log({ firebase: lastDateFirebase })

            try {
                const update = await updateDateFirebaseDelivery(tank_id_firebase, lastDateDelivery);
                console.log('Send data to Line group. Data is change. ...tank id : ' + tank[index])
                dataSummary.push(dateEndDataBase)

            } catch (ex) { res.status(500).json({ message: ex.message }) }
        }
        catch (ex) { res.status(500).json({ message: ex.message }) }
    }
    var pushLine = sendLineSummary(dataSummary);
    res.send(pushLine)
})

app.get('/alarm', async (req, res) => {

    const alarm_status = 6;
    const alarm_id = 'alarm'
    const responseArray = []
    try {
        const dataAlarms = await fetchDataAlarm(alarm_status)
        console.log({ dataAlarms: dataAlarms })
        var lastDateAlarm = dataAlarms.data
        console.log({ alarm_date: `${lastDateAlarm}` })
        console.log({ alarm_date: lastDateAlarm })
        // lastDateDelivery = moment(lastDateDelivery).utcOffset(7)
        lastDateAlarm = `${lastDateAlarm}`
        // console.log({ delivery: lastDateDelivery })

        const getFirebaseAlarm = await fetchFirebaseAlarm(alarm_id)
        // console.log({ firebase: getFirebaseAlarm })
        const lastDateFirebaseAlarm = getFirebaseAlarm.last_date_alarm
        console.log({ firebase: lastDateFirebaseAlarm })

        var check = (`${lastDateAlarm}` == lastDateFirebaseAlarm)
        console.log({ check: check })
        if (check == false) {
            try {
                const update = await updateDateFirebaseAlarm(alarm_id, lastDateAlarm);
                console.log('Send data to Line group. Data is change. ...alarm_id : ' + alarm_id)
                sendLineAlarm(dataAlarms);
                responseArray.push('Send data to Line group. Data is change. ...alarm_id : ' + alarm_id)
            }
            catch (ex) { res.status(500).json({ message: ex.message }) }

        } else {
            console.log('Not sent line.Becourse data not change...alarm_id : ' + alarm_id)
            responseArray.push('Not sent line.Becourse data not change...alarm_id : ' + alarm_id)
        }
        res.json(responseArray)
    }
    catch (ex) {
        console.log({ status: 'Not found status Low(7).' })
        res.status(500).json({ message: ex.message })
    }


})


function sendLine(data) {

    var total = data.end_vol - data.start_vol;
    var tank_id = data.tank_id;
    var datetime_end_dlv = data.end_dlv;
    // date_end_dlv = moment(datetime_end_dlv).utcOffset(7)

    // var datetimeConvert = `${moment(datetime_end_dlv).utcOffset(7)}`
    var datetimeConvert = new Date(datetime_end_dlv).toUTCString()
    var date = datetimeConvert.substring(0, 16)
    var time = datetimeConvert.substring(16, 22)
    // console.log({ dateConvert: datetimeConvert })
    // console.log({ date: date })
    // console.log({ time: time })
    // console.log({ total: total })
    // console.log({ tank_id: tank_id })

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer kQnbHZDDKe1TiJ3TChlBmDSlaAHxg7oB2Rxwg6x3NY5DDGdSZteZcYPWoGWyCoWFG7Mu7IkmLTa5Gjg5EEcRf+qkmsd0JlDSaoxGDDqodfL0EYxLqEykRcz6ZeS7jniWxDdLmmcdL3edF31WnAz77wdB04t89/1O/w1cDnyilFU='             //<- b/c Angular understands text
    }
    const body = JSON.stringify({

        to: "C07748b108c8f952ef59957157aa5dd9a",
        messages: [
            {
                "type": "flex",
                "altText": "รายงานยอดลงน้ำมันล่าสุด",
                "contents": {
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "url": "https://firebasestorage.googleapis.com/v0/b/gasstation-ea536.appspot.com/o/logo-gasstation.jpg?alt=media&token=18e586bd-d02b-4a8f-a7bb-de63fdf2e6fb",
                        "size": "full",
                        "aspectRatio": "20:6",
                        "aspectMode": "cover"
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "รายงานยอดลงน้ำมันล่าสุด",
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "sm",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": `วันที่ ${date}`,
                                        "size": "sm"
                                    },
                                    {
                                        "type": "text",
                                        "text": `เวลา ${time} น.`,
                                        "size": "sm"
                                    }
                                ]
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "lg",
                                "spacing": "sm",
                                "contents": [
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": `Tank ${tank_id} Diesel B10`,
                                                "color": "#54ACFF",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 8
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": " ",
                                                "color": "#666666",
                                                "size": "sm",
                                                "flex": 1
                                            },
                                            {
                                                "type": "text",
                                                "text": "จำนวน",
                                                "color": "#666666",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 4
                                            },
                                            {
                                                "type": "text",
                                                "text": `${total}`,
                                                "wrap": true,
                                                "color": "#54ACFF",
                                                "size": "xl",
                                                "weight": "bold",
                                                "flex": 5
                                            },
                                            {
                                                "type": "text",
                                                "text": "ลิตร",
                                                "wrap": true,
                                                "color": "#666666",
                                                "weight": "bold",
                                                "size": "sm",
                                                "flex": 2
                                            }
                                        ]
                                    },

                                ]
                            },

                        ]
                    }
                }
            }
        ]
    })

    return new Promise((resolve, reject) => {

        request.post({
            url: 'https://api.line.me/v2/bot/message/push',
            headers: headers,
            body: body
        }, (error, response, body) => {
            if (error) reject(error)
            resolve(response)
        })
    })
}

// function convertDateForLine(data) {
//     return dataConvert = data.map(data =>  data.end_vol - data.start_vol )
// }

function sendLineSummary(data) {

    console.log(data)
    // var total = data[0].end_vol - data[0].start_vol;
    // var tank_id = data[0].tank_id;
    // var datetime_end_dlv = data[0].end_dlv;

    var tank_id = data.map( data => data.tank_id)
    var total = data.map(data => data.end_vol - data.start_vol)


    // var datetimeConvert = new Date(datetime_end_dlv).toUTCString()
    // var date = datetimeConvert.substring(0, 16)
    // var time = datetimeConvert.substring(16, 22)


    // console.log({ dateConvert: datetimeConvert })
    // console.log({ date: date })
    // console.log({ time: time })
    // console.log({ total: total })
    // console.log({ tank_id: tank_id })




    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer kQnbHZDDKe1TiJ3TChlBmDSlaAHxg7oB2Rxwg6x3NY5DDGdSZteZcYPWoGWyCoWFG7Mu7IkmLTa5Gjg5EEcRf+qkmsd0JlDSaoxGDDqodfL0EYxLqEykRcz6ZeS7jniWxDdLmmcdL3edF31WnAz77wdB04t89/1O/w1cDnyilFU='             //<- b/c Angular understands text
    }



    const body = JSON.stringify({

        to: "C07748b108c8f952ef59957157aa5dd9a",
        messages: [
            {
                "type": "flex",
                "altText": "รายงานยอดลงน้ำมันประจำวัน",
                "contents": {
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "url": "https://firebasestorage.googleapis.com/v0/b/gasstation-ea536.appspot.com/o/logo-gasstation.jpg?alt=media&token=18e586bd-d02b-4a8f-a7bb-de63fdf2e6fb",
                        "size": "full",
                        "aspectRatio": "20:6",
                        "aspectMode": "cover"
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "รายงานยอดลงน้ำมันประจำวัน",
                                "weight": "bold",
                                "size": "md"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "lg",
                                "spacing": "sm",
                                "contents": [
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": `Tank ${tank_id[0]} Diesel B10`,
                                                "color": "#54ACFF",
                                                "size": "xl",
                                                "weight": "bold",
                                                "flex": 8
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": " ",
                                                "color": "#666666",
                                                "size": "sm",
                                                "flex": 1
                                            },
                                            {
                                                "type": "text",
                                                "text": "จำนวน",
                                                "color": "#666666",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 4
                                            },
                                            {
                                                "type": "text",
                                                "text": `${total[0].toFixed(2)}`,
                                                "wrap": true,
                                                "color": "#54ACFF",
                                                "size": "md",
                                                "weight": "bold",
                                                "flex": 5
                                            },
                                            {
                                                "type": "text",
                                                "text": "ลิตร",
                                                "wrap": true,
                                                "color": "#666666",
                                                "weight": "bold",
                                                "size": "sm",
                                                "flex": 2
                                            }
                                        ]
                                    }, 
                                    

                                ]
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "lg",
                                "spacing": "sm",
                                "contents": [
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": `Tank ${tank_id[1]} Diesel B10`,
                                                "color": "#54ACFF",
                                                "size": "xl",
                                                "weight": "bold",
                                                "flex": 8
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": " ",
                                                "color": "#666666",
                                                "size": "sm",
                                                "flex": 1
                                            },
                                            {
                                                "type": "text",
                                                "text": "จำนวน",
                                                "color": "#666666",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 4
                                            },
                                            {
                                                "type": "text",
                                                "text": `${total[1].toFixed(2)}`,
                                                "wrap": true,
                                                "color": "#54ACFF",
                                                "size": "md",
                                                "weight": "bold",
                                                "flex": 5
                                            },
                                            {
                                                "type": "text",
                                                "text": "ลิตร",
                                                "wrap": true,
                                                "color": "#666666",
                                                "weight": "bold",
                                                "size": "sm",
                                                "flex": 2
                                            }
                                        ]
                                    }, 
                                    

                                ]
                            },
                           


                        ]
                    }
                }
            }
        ]
    })
    return new Promise((resolve, reject) => {
        request.post({
            url: 'https://api.line.me/v2/bot/message/push',
            headers: headers,
            body: body
        }, (error, response, body) => {
            if (error) reject(error)
            resolve(response)
        })
    })
}


function sendLineAlarm(data) {
    console.log({ data: data })
    var tank_id = data.tank_id;
    var datetime = data.data;
    var status = data.alarm
    // date_end_dlv = moment(datetime_end_dlv).utcOffset(7)

    // var datetimeConvert = `${moment(datetime_end_dlv).utcOffset(7)}`
    var datetimeConvert = new Date(datetime).toUTCString()
    var date = datetimeConvert.substring(0, 16)
    var time = datetimeConvert.substring(16, 22)
    // console.log({ dateConvert: datetimeConvert })
    // console.log({ date: date })
    // console.log({ time: time })

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer kQnbHZDDKe1TiJ3TChlBmDSlaAHxg7oB2Rxwg6x3NY5DDGdSZteZcYPWoGWyCoWFG7Mu7IkmLTa5Gjg5EEcRf+qkmsd0JlDSaoxGDDqodfL0EYxLqEykRcz6ZeS7jniWxDdLmmcdL3edF31WnAz77wdB04t89/1O/w1cDnyilFU='             //<- b/c Angular understands text
    }
    const body = JSON.stringify({

        to: "C07748b108c8f952ef59957157aa5dd9a",
        messages: [
            {
                "type": "flex",
                "altText": "แจ้งเตือนน้ำมันใกล้หมด",
                "contents": {
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "url": "https://firebasestorage.googleapis.com/v0/b/gasstation-ea536.appspot.com/o/logo-gasstation.jpg?alt=media&token=18e586bd-d02b-4a8f-a7bb-de63fdf2e6fb",
                        "size": "full",
                        "aspectRatio": "20:6",
                        "aspectMode": "cover"
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": `แจ้งเตือนน้ำมันใกล้หมด (${status})`,
                                "color": "#FF6666",
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "sm",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": `วันที่ ${date}`,
                                        "size": "sm"
                                    },
                                    {
                                        "type": "text",
                                        "text": `เวลา ${time} น.`,
                                        "size": "sm"
                                    }
                                ]
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "lg",
                                "spacing": "sm",
                                "contents": [
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": `Tank ${tank_id} Diesel B10`,
                                                "color": "#54ACFF",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 8
                                            }
                                        ]
                                    },

                                ]
                            },

                        ]
                    }
                }
            }
        ]
    })

    return new Promise((resolve, reject) => {

        request.post({
            url: 'https://api.line.me/v2/bot/message/push',
            headers: headers,
            body: body
        }, (error, response, body) => {
            if (error) reject(error)
            resolve(response)
        })
    })
}

function sendLineSummaryNew(data) {
    console.log(data)
    // var total = data[0].end_vol - data[0].start_vol;
    // var tank_id = data[0].tank_id;
    // var datetime_end_dlv = data[0].end_dlv;

    var datetimeConvert = new Date(datetime_end_dlv).toUTCString()
    var date = datetimeConvert.substring(0, 16)
    var time = datetimeConvert.substring(16, 22)


    // console.log({ dateConvert: datetimeConvert })
    // console.log({ date: date })
    // console.log({ time: time })
    // console.log({ total: total })
    // console.log({ tank_id: tank_id })

    // ------------------Edit------------------------
    // dataItems = data;
    // var tankArray = []

    // for (let index = 0; index < data.length; index++) {

    //     var total = data[index].end_vol - data[index].start_vol;
    //     console.log({ total: total })

    //     var tank_id = data[index].tank_id;
    //     console.log({ tank_id: tank_id })

    //     var datetime_end_dlv = data[index].end_dlv;
    //     console.log({ datetime_end_dlv: datetime_end_dlv })

    //     var tank_name =
    //     {
    //         "type": "box",
    //         "layout": "vertical",
    //         "margin": "lg",
    //         "spacing": "sm",
    //         "contents": [
    //             {
    //                 "type": "box",
    //                 "layout": "baseline",
    //                 "spacing": "sm",
    //                 "contents": [
    //                     {
    //                         "type": "text",
    //                         "text": `Tank ${tank_id} Diesel B10`,
    //                         "color": "#54ACFF",
    //                         "size": "sm",
    //                         "weight": "bold",
    //                         "flex": 8
    //                     }
    //                 ]
    //             },
    //             {
    //                 "type": "box",
    //                 "layout": "baseline",
    //                 "spacing": "sm",
    //                 "contents": [
    //                     {
    //                         "type": "text",
    //                         "text": " ",
    //                         "color": "#666666",
    //                         "size": "sm",
    //                         "flex": 1
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": "จำนวน",
    //                         "color": "#666666",
    //                         "size": "sm",
    //                         "weight": "bold",
    //                         "flex": 4
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": `${total.toFixed(2)}`,
    //                         "wrap": true,
    //                         "color": "#54ACFF",
    //                         "size": "xl",
    //                         "weight": "bold",
    //                         "flex": 5
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": "ลิตร",
    //                         "wrap": true,
    //                         "color": "#666666",
    //                         "weight": "bold",
    //                         "size": "sm",
    //                         "flex": 2
    //                     }
    //                 ]
    //             }, {
    //                 "type": "box",
    //                 "layout": "vertical",
    //                 "margin": "sm",
    //                 "contents": [
    //                     {
    //                         "type": "box",
    //                         "layout": "baseline",
    //                         "spacing": "sm",
    //                         "contents": [
    //                             {
    //                                 "type": "text",
    //                                 "text": " ",
    //                                 "color": "#666666",
    //                                 "size": "sm",
    //                                 "flex": 1
    //                             },
    //                             {
    //                                 "type": "text",
    //                                 "text": `วันที่ ${date}`,
    //                                 "size": "sm",
    //                                 "flex": 9
    //                             },
    //                         ]
    //                     },
    //                     {
    //                         "type": "box",
    //                         "layout": "baseline",
    //                         "spacing": "sm",
    //                         "contents": [
    //                             {
    //                                 "type": "text",
    //                                 "text": " ",
    //                                 "color": "#666666",
    //                                 "size": "sm",
    //                                 "flex": 1
    //                             },
    //                             {
    //                                 "type": "text",
    //                                 "text": `เวลา ${time} น.`,
    //                                 "size": "sm",
    //                                 "flex": 9
    //                             }
    //                         ]
    //                     },

    //                 ]
    //             },

    //         ]
    //     }
    //     tankArray.push(tank_name)
    // }

    // return tankArray
    // ------------------Edit------------------------





    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer kQnbHZDDKe1TiJ3TChlBmDSlaAHxg7oB2Rxwg6x3NY5DDGdSZteZcYPWoGWyCoWFG7Mu7IkmLTa5Gjg5EEcRf+qkmsd0JlDSaoxGDDqodfL0EYxLqEykRcz6ZeS7jniWxDdLmmcdL3edF31WnAz77wdB04t89/1O/w1cDnyilFU='             //<- b/c Angular understands text
    }



    const body = JSON.stringify({

        to: "C07748b108c8f952ef59957157aa5dd9a",
        messages: [
            {
                "type": "flex",
                "altText": "รายงานยอดลงน้ำมันประจำวัน",
                "contents": {
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "url": "https://firebasestorage.googleapis.com/v0/b/gasstation-ea536.appspot.com/o/logo-gasstation.jpg?alt=media&token=18e586bd-d02b-4a8f-a7bb-de63fdf2e6fb",
                        "size": "full",
                        "aspectRatio": "20:6",
                        "aspectMode": "cover"
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "รายงานยอดลงน้ำมันล่าสุด",
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "lg",
                                "spacing": "sm",
                                "contents": [
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": `Tank ${tank_id} Diesel B10`,
                                                "color": "#54ACFF",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 8
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "baseline",
                                        "spacing": "sm",
                                        "contents": [
                                            {
                                                "type": "text",
                                                "text": " ",
                                                "color": "#666666",
                                                "size": "sm",
                                                "flex": 1
                                            },
                                            {
                                                "type": "text",
                                                "text": "จำนวน",
                                                "color": "#666666",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 4
                                            },
                                            {
                                                "type": "text",
                                                "text": `${total.toFixed(2)}`,
                                                "wrap": true,
                                                "color": "#54ACFF",
                                                "size": "xl",
                                                "weight": "bold",
                                                "flex": 5
                                            },
                                            {
                                                "type": "text",
                                                "text": "ลิตร",
                                                "wrap": true,
                                                "color": "#666666",
                                                "weight": "bold",
                                                "size": "sm",
                                                "flex": 2
                                            }
                                        ]
                                    }, {
                                        "type": "box",
                                        "layout": "vertical",
                                        "margin": "sm",
                                        "contents": [
                                            {
                                                "type": "box",
                                                "layout": "baseline",
                                                "spacing": "sm",
                                                "contents": [
                                                    {
                                                        "type": "text",
                                                        "text": " ",
                                                        "color": "#666666",
                                                        "size": "sm",
                                                        "flex": 1
                                                    },
                                                    {
                                                        "type": "text",
                                                        "text": `วันที่ ${date}`,
                                                        "size": "sm",
                                                        "flex": 9
                                                    },
                                                ]
                                            },
                                            {
                                                "type": "box",
                                                "layout": "baseline",
                                                "spacing": "sm",
                                                "contents": [
                                                    {
                                                        "type": "text",
                                                        "text": " ",
                                                        "color": "#666666",
                                                        "size": "sm",
                                                        "flex": 1
                                                    },
                                                    {
                                                        "type": "text",
                                                        "text": `เวลา ${time} น.`,
                                                        "size": "sm",
                                                        "flex": 9
                                                    }
                                                ]
                                            },

                                        ]
                                    },

                                ]
                            },


                        ]
                    }
                }
            }
        ]
    })
    return new Promise((resolve, reject) => {
        // request.post({
        //     url: 'https://api.line.me/v2/bot/message/push',
        //     headers: headers,
        //     body: body
        // }, (error, response, body) => {
        //     if (error) reject(error)
        //     resolve(response)
        // })
    })
}

// exports.api = functions.https.onRequest(app);
