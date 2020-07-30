const functions = require('firebase-functions');
const bodyParser = require('body-parser')
const request = require('request')
const express = require('express')
const cors = require('cors')
const app = express()
var moment = require('moment');

const { fetchDataDelivery, fetchDataAlarm, fetchDataHistoryLog } = require('../services/database_1');
const { fetchFirebaseDelivery, updateDateFirebaseDelivery, fetchFirebaseAlarm, updateDateFirebaseAlarm, } = require('../services/firebase_1');
const { convertDate } = require('../services/thaidate_pipe')

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Group 1
const lineGroupId = 'xxxx'
const lineToken = 'Bearer'

 

module.exports = {
    async station_1() {

        console.log('--------------------------------station_1 runing')
        delivery();
        summary_23_59();
        alarmStatusLow();


        var current_time = getTimeMoment()
        var time_minute = getTimeMomentMinute();



        if (current_time == '11:57 pm') {
            console.log('ส่งรายการก่อนเที่ยงคืน (23.59)')
            // ส่งก่อนเที่ยง
            summary_23_59();
        } else if (time_minute == '30' || time_minute == '00') {
            console.log('ตรวจสอบน้ำมันทุกถังทุกๆ 30 นาที')
            // เตืมน้ำมันลงถัง
            delivery();
        } else if (time_minute == '05' || time_minute == '15' || time_minute == '25' || time_minute == '35' || time_minute == '45' || time_minute == '55') {
            console.log('ตรวจสอบน้ำมันทุกถังทุกๆ 10 นาที')
            //เตือนสถานะ 3
            alarmStatusLow();
        } else {
            console.log('*** station_1 ไม่มีการทำงานใดๆ เนื่องจากไม่เข้าเงิื่อนไขเวลา')
        }

        return
    }
}


function getTimeMoment() {
    var current_time = moment().utcOffset(7)
    current_time = current_time.format('h:mm a')
    // console.log({ current_time: current_time })
    return current_time;
}

function getTimeMomentMinute() {
    var current_time = moment().utcOffset(7)
    current_time = current_time.format('mm')
    // console.log({ current_time: current_time })
    return current_time;
}

// เตืมน้ำมันลงถัง
async function delivery() {
    console.log({ server: 'connect api delivery' })
    // res.send({ response: 'connect api ปั้มน้ำมัน Service' })
    const tank = [1, 2]
    responseArray = []
    try {

        for (let index = 0; index < tank.length; index++) {
            console.log('station_1_tank_id_: ' + tank[index])
            const tank_id_database = tank[index];
            const tank_id_firebase = `station_1_tank_id_${tank[index]}`

            const dateEndDataBase = await fetchDataDelivery(tank_id_database)
            var { date,  time } = datetimeFullMoment(dateEndDataBase.end_dlv)
            var lastDateDelivery = `${date}, ${time}`
            console.log({ lastDateDelivery: lastDateDelivery })


            const getFirebase = await fetchFirebaseDelivery(tank_id_firebase)
            const lastDateFirebase = (getFirebase.date_end)
            console.log({ firebase: lastDateFirebase })

            console.log({ check: lastDateDelivery == lastDateFirebase })

            if (lastDateDelivery != lastDateFirebase) {
                try {
                    const update = await updateDateFirebaseDelivery(tank_id_firebase, lastDateDelivery);
                    console.log('Send  data delivery to Line group. Data is change. ...tank id : ' + tank[index])
                    sendLineDelivey(dateEndDataBase ,date, time);
                    responseArray.push('Send data delivery to Line group. Data is change. ...tank id : ' + tank[index])
                }
                catch (ex) {
                    // res.status(500).json({ message: ex.message })
                    console.log({ messageError: ex.message })
                }

            } else {
                console.log('Not sent delivery  line.Becourse data not change...tank id : ' + tank[index])
                responseArray.push('Not sent delivery line.Becourse data not change...tank id : ' + tank[index])
            }

        }
        // res.json(responseArray)
        return responseArray

    }
    catch (ex) {
        //  res.status(500).json({ message: ex.message }) 
        console.log({ messageError: ex.message })

    }




}

// ส่งก่อนเที่ยง
async function summary_23_59() {

    console.log({ server: 'connect api summary_23_59' })
    // res.send({ response: 'connect api ปั้มน้ำมัน Service' })

    const tank = [1, 2]
    const dataSummary = []
    for (let index = 0; index < tank.length; index++) {
        console.log('station_1_tank_id_ : ' + tank[index])
        const tank_id_database = tank[index];

        try {

            const dateEndDataBase = await fetchDataDelivery(tank_id_database)
            var lastDateDelivery = dateEndDataBase.end_dlv
            // console.log({ delivery: lastDateDelivery })
            lastDateDelivery = `${lastDateDelivery}`
            // console.log({ delivery: lastDateDelivery })

            dataSummary.push(dateEndDataBase)

        }
        catch (ex) {
            // res.status(500).json({ message: ex.message })
            console.log({ messageError: ex.message })
        }
    }
    sendLineSummary(dataSummary);
    // res.send(pushLine)
    return 'Send data to sendLineSummary'

}

async function alarmStatusLow() {

    const alarm_status = 3;
    const alarm_id = 'station_1_alarm'
    const responseArray = []
    try {

        const dataAlarms = await fetchDataAlarm(alarm_status)
        console.log({ lastDateAlarmDB: dataAlarms.data })

        var { date, time } = datetimeFullMoment(dataAlarms.data)
        var lastDateAlarm = `${date}, ${time}`
        console.log({ lastDateAlarm: lastDateAlarm })

        const getFirebaseAlarm = await fetchFirebaseAlarm(alarm_id)
        // console.log({ firebase: getFirebaseAlarm })
        const lastDateFirebaseAlarm = getFirebaseAlarm.last_date_alarm
        console.log({ firebase: lastDateFirebaseAlarm })

        console.log({ check: lastDateAlarm == lastDateFirebaseAlarm })
        if (lastDateAlarm != lastDateFirebaseAlarm) {
            try {

                updateDateFirebaseAlarm(alarm_id, lastDateAlarm);

                const historyLog = await fetchDataHistoryLog(dataAlarms.tank_id);
                // console.log({ historyLog: historyLog })
                console.log('Send data alarm to Line group. Data is change. ...alarm_id : ' + alarm_id)
                sendLineAlarm(dataAlarms, historyLog.prd_lt, date, time);
                responseArray.push('Send data alarm to Line group. Data is change. ...alarm_id : ' + alarm_id)
            }
            catch (ex) {
                // res.status(500).json({ message: ex.message })
                console.log({ messageError: ex.message })
            }


        } else {
            console.log('Not sent alarm line.Becourse data not change...alarm_id : ' + alarm_id)
            responseArray.push('Not sent alarm line.Becourse data not change...alarm_id : ' + alarm_id)
        }
        // res.json(responseArray)
    }
    catch (ex) {
        console.log({ status: 'Not found status Low(7).' })
        // res.status(500).json({ message: ex.message })
    }

    return responseArray


}

function sendLineDelivey(data ,date ,time) {

    var total = data.end_vol - data.start_vol;
    var tank_id = data.tank_id;
    // var datetime_end_dlv = data.end_dlv;


    // var now = moment(datetime_end_dlv).utcOffset(7)
    // var date = moment(now).format('DD-MM-YYYY');
    // var time = moment(now).format('HH:mm');


    const headers = {
        'Content-Type': 'application/json',
        'Authorization': lineToken
    }
    const body = JSON.stringify({

        to: lineGroupId,
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
                                "type": "text",
                                "text": `วันที่ ${date} เวลา ${time}`,
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
                                                "text": `${mapNameTank(tank_id)}`,
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


function sendLineSummary(data) {


    var { today, time } = todayMap()
    console.log(today, time)

    var tank_id = data.map(data => data.tank_id)
    var total = data.map(data => data.end_vol - data.start_vol)

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': lineToken
    }
    const body = JSON.stringify({

        to: lineGroupId,
        messages: [
            {
                "type": "flex",
                "altText": "รายงานยอดน้ำมัน",
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
                                "text": "รายงานยอดน้ำมัน",
                                "weight": "bold",
                                "size": "md"
                            },
                            {
                                "type": "text",
                                "text": `วันที่ ${today} เวลา ${time}`,
                                "weight": "bold",
                                "size": "md"
                            },

                            //-----1-----
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
                                                "text": `${mapNameTank(tank_id[0])} = ${total[0].toFixed(2)} ลิตร`,
                                                "color": "#54ACFF",
                                                "size": "md",
                                                "weight": "bold",
                                                "flex": 8
                                            }
                                        ]
                                    },

                                ]
                            },
                            //-----1-----
                            //-----2-----
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
                                                "text": `${mapNameTank(tank_id[1])} = ${total[1].toFixed(2)} ลิตร `,
                                                "color": "#54ACFF",
                                                "size": "md",
                                                "weight": "bold",
                                                "flex": 8
                                            }
                                        ]
                                    },

                                ]
                            },
                            //-----2-----

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


function sendLineAlarm(data, volume, date, time) {
    console.log({ function  : ' ===>>  send line alarm.'})
    var tank_name = mapNameTank(data.tank_id)
    var total = volume

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': lineToken
    }
    const body = JSON.stringify({

        to: lineGroupId,
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
                                "text": `แจ้งเตือนน้ำมันใกล้หมด`,
                                "color": "#FF6666",
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "text",
                                "text": `วันที่ ${date} เวลา ${time}`,
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
                                                "text": `${tank_name}`,
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
                                                "text": "ปริมาณคงเหลือ",
                                                "color": "#666666",
                                                "size": "sm",
                                                "weight": "bold",
                                                "flex": 5
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

function mapNameTank(tank_id) {
    var name = ''
    switch (tank_id) {
        case 1: name = 'T1 Diesel B10'
            break;
        case 2: name = 'T2 Diesel B10'
            break;
        default: name = tank_id
        // code block
    }
    return name
}

function todayMap() {

    var now = moment().utcOffset(7)
    var today = moment(now).format('DD-MM-YYYY');
    var time = moment(now).format('HH:mm');

    return { today, time }
}

function datetimeFullMoment(dates) {
    
    // var dates = moment(dates).utcOffset(7) // for dev time +7

    var date = moment(dates).format('DD-MM-YYYY');
    var time = moment(dates).format('HH:mm');


    return { date, time }
}


// exports.api = functions.https.onRequest(app);
