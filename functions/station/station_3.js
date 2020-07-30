const functions = require('firebase-functions');
const bodyParser = require('body-parser')
const request = require('request')
const express = require('express')
const cors = require('cors')
const app = express()
var moment = require('moment');

const {
	fetchDataDelivery,
	fetchDataAlarm,
	fetchDataAlarmWater,
	fetchDataHistoryLog,
	fetchDataHistoryVolumnWaterLog,
} = require('../services/database_3');
const {
	fetchFirebaseDelivery,
	updateDateFirebaseDelivery,
	fetchFirebaseAlarm,
	updateDateFirebaseAlarm,
	fetchFirebaseAlarmWater,
	updateDateFirebaseAlarmWater
} = require('../services/firebase_3');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Group 1
// const lineGroupId = 'C07748b108c8f952ef59957157aa5dd9a'
// const lineToken = 'Bearer kQnbHZDDKe1TiJ3TChlBmDSlaAHxg7oB2Rxwg6x3NY5DDGdSZteZcYPWoGWyCoWFG7Mu7IkmLTa5Gjg5EEcRf+qkmsd0JlDSaoxGDDqodfL0EYxLqEykRcz6ZeS7jniWxDdLmmcdL3edF31WnAz77wdB04t89/1O/w1cDnyilFU='

// Group 3
var lineGroupId = 'Ca48561a4942de12d4e51222aa5af3752'
var lineToken = 'Bearer JTvbw3JzKbjfkKc0P2ueIMetztAvd/ZnJm3+d25SqewGj4T4R8/7Vpl6NXsEcGjCILDWeyJ4Q1PaM9WNXIF8lcE2zxOV2EGqVlmMpQgxJnflrMErnXmvcY5liqu0hV2tHWNs6N84PKyFfROIfo8CLQdB04t89/1O/w1cDnyilFU='


module.exports = {
	async station_3() {

		console.log('--------------------------------station_3 runing')
		// delivery();
		// summary_23_59();
		// alarmStatusLow();

		var current_time = getTimeMoment()
		var time_minute = getTimeMomentMinute();

		// if (current_time == '03:31 am' || current_time == '22:30 pm') {
		if (current_time == '23:53 pm') {
			console.log('==========>> Time set 3 <======== :' + current_time)
			// ส่งก่อนเที่ยง ส่งรายการก่อนเที่ยงคืน (23.59)
			await summary_23_59();
		}


		if ( 
			time_minute == '03' || time_minute == '13' || time_minute == '13' ||
			time_minute == '33' || time_minute == '43' || time_minute == '53'
			&& current_time != '23:53 pm' && current_time != '22:33 pm') {
			// เตืมน้ำมันลงถัง ตรวจสอบน้ำมันทุกถังทุกๆ 10 นาที
			console.log({ time_minute: time_minute })
			delivery();
		}	
		if (
			time_minute == '05' || time_minute == '15' || time_minute == '25' ||
			time_minute == '35' || time_minute == '45' || time_minute == '55'
			&& current_time != '23:55 pm') {
			// เตืมน้ำมันลงถัง ตรวจสอบน้ำมันทุกถังทุกๆ 10 นาที
			console.log({ time_minute: time_minute })
			alarmStatusLow();
			alarmStatusWater()
		}

		//เตือนสถานะ 3


	}
}




// เตืมน้ำมันลงถัง
async function delivery() {

	console.log({ server: '========>>>>  connect api delivery' })
	// res.send({ response: 'connect api ปั้มน้ำมัน Service' })

	const tank = [1, 2, 3, 4, 5, 6]
	responseArray = []
	try {

		for (let index = 0; index < tank.length; index++) {
			// console.log('station_3_tank_id_ : ' + tank[index])
			const tank_id_database = tank[index];
			const tank_id_firebase = `station_3_tank_id_${tank[index]}`

			const dateEndDataBase = await fetchDataDelivery(tank_id_database)
			var { date, time } = datetimeFullMoment(dateEndDataBase.end_dlv)
			var lastDateDelivery = `${date}, ${time}`
			console.log({ lastDateDelivery: lastDateDelivery })


			const getFirebase = await fetchFirebaseDelivery(tank_id_firebase)
			const lastDateFirebase = (getFirebase.date_end)
			console.log({ firebase: lastDateFirebase })

			console.log({ check: lastDateDelivery == lastDateFirebase })

			if (lastDateDelivery != lastDateFirebase) {
				try {
					  
					console.log('Send  data delivery to Line group. Data is change. ...tank id : ' + tank[index])
					sendLineDelivey(dateEndDataBase, date, time, tank_id_firebase, lastDateDelivery);
					responseArray.push('Send data delivery to Line group. Data is change. ...tank id : ' + tank[index])
				}
				catch (ex) {
					// res.status(500).json({ message: ex.message })
					console.log({ messageError: ex.message })
				}

			} else {
				console.log('ไม่มีการลงน้ำมัน.station 3..tank id : ' + tank[index])
				responseArray.push('ไม่มีการลงน้ำมัน...tank id : ' + tank[index])
			}

		}
		// res.json(responseArray)
		console.log(responseArray)
		return responseArray

	}
	catch (ex) {
		//  res.status(500).json({ message: ex.message }) 
		console.log({ messageError: ex.message })
	}

	return


}

// ส่งก่อนเที่ยง
async function summary_23_59() {

	console.log({ server: '========>>>>  connect api summary_03:00 am / 22:30 pm' })
	// res.send({ response: 'connect api ปั้มน้ำมัน Service' })

	const tank = [1, 2, 3, 4, 5, 6]
	const dataSummary = []
	for (let index = 0; index < tank.length; index++) {
		console.log('station_3_tank_id_ : ' + tank[index])
		const tank_id_database = tank[index];

		try {

			const dataHistoryLast = await fetchDataHistoryLog(tank_id_database)
			console.log(dataHistoryLast)
			// var lastDateDelivery = dateEndDataBase.end_dlv
			// console.log({ delivery: lastDateDelivery })
			// lastDateDelivery = `${lastDateDelivery}`
			// console.log({ delivery: lastDateDelivery })

			dataSummary.push(dataHistoryLast)

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



async function alarmStatusWater() {
	console.log({ server: '========>>>>   connect api alarmStatusWater' })

	const alarm_status = 7;
	const alarm_id = 'station_3_alarm_water'
	const responseArray = []
	try {
		const dataAlarms = await fetchDataAlarmWater(alarm_status)
		console.log({ lastDateAlarmDB: dataAlarms.data })

		var { date, time } = datetimeFullMoment(dataAlarms.data)
		var lastDateAlarm = `${date}, ${time}`
		console.log({ lastDateAlarmWater: lastDateAlarm })

		const getFirebaseAlarm = await fetchFirebaseAlarmWater(alarm_id)
		// console.log({ firebase: getFirebaseAlarmWater })
		const lastDateFirebaseAlarm = getFirebaseAlarm.last_date_alarm
		console.log({ firebaseWater: lastDateFirebaseAlarm })

		console.log({ checkWater: lastDateAlarm == lastDateFirebaseAlarm })
		if (lastDateAlarm != lastDateFirebaseAlarm) {

			const volumnWater = await fetchDataHistoryVolumnWaterLog(dataAlarms.tank_id)
			if (volumnWater >= 1) {
				try {

					const historyLog = await fetchDataHistoryLog(dataAlarms.tank_id);
					console.log('Send data alarm WATER to Line group. Data is change. ...alarm_id : ' + alarm_id)
					sendLineAlarmWater(dataAlarms, historyLog.h2o_lt, date, time, alarm_id, lastDateAlarm);
					responseArray.push('Send data alarm WATER to Line group. Data is change. ...alarm_id : ' + alarm_id)
				}
				catch (ex) {
					// res.status(500).json({ message: ex.message })
					console.log({ messageError: ex.message })
				}
			}



		} else {
			console.log('Not sent alarm WATER line. alarm_id : ' + alarm_id)
			responseArray.push('Not sent alarm WATER line.Becourse data not change...alarm_id : ' + alarm_id)
		}
		// res.json(responseArray)
	}
	catch (ex) {
		console.log({ status: 'ไม่พบน้ำไม่ถังน้ำมัน  Not found status Low(7). WATER' })
		// res.status(500).json({ message: ex.message })
	}

	return responseArray


}

//น้ำมันต่ำ
async function alarmStatusLow() {
	console.log({ server: '========>>>>  connect api alarmStatusLow' })

	const alarm_status = 3;
	const alarm_id = 'station_3_alarm'
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


				const historyLog = await fetchDataHistoryLog(dataAlarms.tank_id);
				console.log('Send data alarm to Line group. Data is change. ...alarm_id : ' + alarm_id)
				sendLineAlarm(dataAlarms, historyLog.prd_lt, date, time, alarm_id, lastDateAlarm);
				responseArray.push('Send data alarm to Line group. Data is change. ...alarm_id : ' + alarm_id)
			}
			catch (ex) {
				// res.status(500).json({ message: ex.message })
				console.log({ messageError: ex.message })
			}


		} else {
			// console.log('Not sent alarm line.Becourse data not change...alarm_id : ' + alarm_id)
			responseArray.push('Not sent alarm line.Becourse data not change...alarm_id : ' + alarm_id)
		}
		// res.json(responseArray)
	}
	catch (ex) {
		console.log({ status: 'ไม่พบสถานะปริมาณน้ำมันต่ำ Not found status Low(3).' })
		// res.status(500).json({ message: ex.message })
	}

	return responseArray


}





function sendLineDelivey(data, date, time , tank_id_firebase, lastDateDelivery) {

	var total = data.end_vol - data.start_vol;
	var tank_id = data.tank_id;


	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `${lineToken}`
	}

	const body = JSON.stringify({
		to: `${lineGroupId}`,
		messages: [
			{
				"type": "flex",
				"altText": "รายงานยอดลงน้ำมันล่าสุด",
				"contents": {
					"type": "bubble",
					"hero": {
						"type": "image",
						"url": "https://firebasestorage.googleapis.com/v0/b/gasstation-e223f.appspot.com/o/cover%2FS__33349651.jpg?alt=media&token=79530ee0-ee90-4c24-a654-c8116255fced",
						"size": "full",
						"aspectRatio": "16:9",
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
								"text": `วันที่ ${date} เวลา ${time} น.`,
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
												"text": `${total.toFixed(0)}`,
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
			if (error) {
				// console.log({error : error})
				reject(error)
			} else {
				// console.log({response : response})
				updateDateFirebaseDelivery(tank_id_firebase, lastDateDelivery);
				resolve(response)
			}
		})
	})
}


function sendLineSummary(data) {


	var { today, time } = todayMap()
	console.log(today, time)

	var tank_id = data.map(data => data.tank_id)
	var total = data.map(data => data.prd_lt)
	// var total = data.map(data => data.end_vol - data.start_vol)
	console.log({ tank_id: tank_id, total: total })

	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `${lineToken}`
	}

	const body = JSON.stringify({
		to: `${lineGroupId}`,
		messages: [
			{
				"type": "flex",
				"altText": "รายงานยอดน้ำมัน",
				"contents": {
					"type": "bubble",
					"hero": {
						"type": "image",
						"url": "https://firebasestorage.googleapis.com/v0/b/gasstation-e223f.appspot.com/o/cover%2FS__33349651.jpg?alt=media&token=79530ee0-ee90-4c24-a654-c8116255fced",
						"size": "full",
						"aspectRatio": "16:9",
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
								"text": `วันที่ ${today} เวลา ${time} น.`,
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
												"text": `${mapNameTank(tank_id[0])} = ${total[0].toFixed(0)} ลิตร`,
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
												"text": `${mapNameTank(tank_id[1])} = ${total[1].toFixed(0)} ลิตร `,
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
							//-----3-----
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
												"text": `${mapNameTank(tank_id[2])} = ${total[2].toFixed(0)} ลิตร `,
												"color": "#54ACFF",
												"size": "md",
												"weight": "bold",
												"flex": 8
											}
										]
									},

								]
							},
							//-----3-----
							//-----4-----
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
												"text": `${mapNameTank(tank_id[3])} = ${total[3].toFixed(0)} ลิตร `,
												"color": "#54ACFF",
												"size": "md",
												"weight": "bold",
												"flex": 8
											}
										]
									},

								]
							},
							//-----4-----
							//-----5-----
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
												"text": `${mapNameTank(tank_id[4])} = ${total[4].toFixed(0)} ลิตร `,
												"color": "#54ACFF",
												"size": "md",
												"weight": "bold",
												"flex": 8
											}
										]
									},

								]
							},
							//-----5-----
							//-----6-----
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
												"text": `${mapNameTank(tank_id[5])} = ${total[5].toFixed(0)} ลิตร `,
												"color": "#54ACFF",
												"size": "md",
												"weight": "bold",
												"flex": 8
											}
										]
									},

								]
							},
							//-----6-----

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

function sendLineAlarm(data, volume, date, time, alarm_id, lastDateAlarm) {
	console.log({ function: ' ===>>  send line alarm LOW.' })
	var tank_name = mapNameTank(data.tank_id)
	var total = volume

	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `${lineToken}`
	}
	const body = JSON.stringify({

		to: `${lineGroupId}`,
		messages: [
			{
				"type": "flex",
				"altText": "แจ้งเตือนน้ำมันใกล้หมด",
				"contents": {
					"type": "bubble",
					"hero": {
						"type": "image",
						"url": "https://firebasestorage.googleapis.com/v0/b/gasstation-e223f.appspot.com/o/cover%2FS__33349651.jpg?alt=media&token=79530ee0-ee90-4c24-a654-c8116255fced",
						"size": "full",
						"aspectRatio": "16:9",
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
								"text": `วันที่ ${date} เวลา ${time} น.`,
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
												"size": "md",
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
												"text": `${total.toFixed(0)}`,
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
			if (error) {
				reject(error)
			} else {
				updateDateFirebaseAlarm(alarm_id, lastDateAlarm);
				resolve(response)
			}
		})
	})
}

function sendLineAlarmWater(data, volume, date, time, alarm_id, lastDateAlarm) {
	var tank_name = mapNameTank(data.tank_id)
	var total = volume

	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `${lineToken}`
	}
	const body = JSON.stringify({

		to: `${lineGroupId}`,
		messages: [
			{
				"type": "flex",
				"altText": "แจ้งเตือนพบน้ำในถังน้ำมัน",
				"contents": {
					"type": "bubble",
					"hero": {
						"type": "image",
						"url": "https://firebasestorage.googleapis.com/v0/b/gasstation-e223f.appspot.com/o/cover%2FS__33349651.jpg?alt=media&token=79530ee0-ee90-4c24-a654-c8116255fced",
						"size": "full",
						"aspectRatio": "16:9",
						"aspectMode": "cover"
					},
					"body": {
						"type": "box",
						"layout": "vertical",
						"contents": [
							{
								"type": "text",
								"text": `แจ้งเตือนพบน้ำในถังน้ำมัน`,
								"color": "#FF6666",
								"weight": "bold",
								"size": "xl"
							},
							{
								"type": "text",
								"text": `วันที่ ${date} เวลา ${time} น.`,
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
												"size": "md",
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
												"text": "ปริมาณน้ำ",
												"color": "#666666",
												"size": "sm",
												"weight": "bold",
												"flex": 5
											},
											{
												"type": "text",
												"text": `${total.toFixed(0)}`,
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
			if (error) {
				reject(error)
			} else {
				updateDateFirebaseAlarmWater(alarm_id, lastDateAlarm);
				resolve(response)
			}
		})
	})
}


function mapNameTank(tank_id) {
	var name = ''
	switch (tank_id) {
		case 1: name = 'T1-E20'
			break;
		case 2: name = 'T2-G91'
			break;
		case 3: name = 'T3-VPG'
			break;
		case 4: name = 'T4-VPD'
			break;
		case 5: name = 'T5-FSD'
			break;
		case 6: name = 'T6-B10'
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

function getTimeMoment() {
	var current_time = moment().utcOffset(7)
	current_time = current_time.format('HH:mm a')
	// console.log({ current_time: current_time })
	return current_time;
}

function getTimeMomentMinute() {
	var current_time = moment().utcOffset(7)
	current_time = current_time.format('mm')
	// console.log({ current_time: current_time })
	return current_time;
}


// exports.api = functions.https.onRequest(app);
