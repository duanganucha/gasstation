
const  db  = require("../configs/firebase_config")

module.exports = {

    fetchFirebaseDelivery(tank_id_firebase) {
        return new Promise(async (resolve, reject) => {

            db.collection('GasStation').doc(tank_id_firebase)
                .onSnapshot((doc) => {

                    if (doc.exists) {
                        // console.log("Document data:", doc.data());
                        resolve(doc.data())
                    } else {
                        // doc.data() will be undefined in this case
                        console.log('No existe ID ' + tank_id_firebase);
                        reject({ message: 'No existe ID ' + tank_id_firebase })
                    }

                })
        })

    }, updateDateFirebaseDelivery(id, lastDateDelivery) {
        return new Promise(async (resolve, reject) => {

            db.collection("GasStation").doc(id)
                .update({
                    "date_end": lastDateDelivery,
                })
                .then(function () {
                    console.log("Document successfully updated!");
                    resolve({
                        ok: true,
                        message: `update success.`
                    });
                }).catch(function (error) {
                    console.error("Error adding document: ", error);
                    reject({
                        ok: false,
                        message: error
                    });
                });

        })
    },fetchFirebaseAlarm(alarm_id) {
        return new Promise(async (resolve, reject) => {

            db.collection('GasStation').doc(alarm_id)
                .onSnapshot((doc) => {

                    if (doc.exists) {
                        // console.log("Document data:", doc.data());
                        resolve(doc.data())
                    } else {
                        // doc.data() will be undefined in this case
                        console.log('No existe ID ' + alarm_id);
                        reject({ message: 'No existe ID ' + alarm_id })
                    }

                })
        })

    }, updateDateFirebaseAlarm(alarm_id, lastDateAlarm) {
        return new Promise(async (resolve, reject) => {

            db.collection("GasStation").doc(alarm_id)
                .update({
                    "last_date_alarm": lastDateAlarm,
                })
                .then(function () {
                    console.log("Document successfully updated!");
                    resolve({
                        ok: true,
                        message: `update success.`
                    });
                }).catch(function (error) {
                    console.error("Error adding document: ", error);
                    reject({
                        ok: false,
                        message: error
                    });
                });

        })
    },fetchFirebaseAlarmWater(alarm_id) {
        return new Promise(async (resolve, reject) => {

            db.collection('GasStation').doc(alarm_id)
                .onSnapshot((doc) => {

                    if (doc.exists) {
                        // console.log("Document data:", doc.data());
                        resolve(doc.data())
                    } else {
                        // doc.data() will be undefined in this case
                        console.log('No existe ID ' + alarm_id);
                        reject({ message: 'No existe ID ' + alarm_id })
                    }

                })
        })

    }, updateDateFirebaseAlarmWater(alarm_id, lastDateAlarm) {
        return new Promise(async (resolve, reject) => {

            db.collection("GasStation").doc(alarm_id)
                .update({
                    "last_date_alarm": lastDateAlarm,
                })
                .then(function () {
                    console.log("Document successfully updated water!");
                    resolve({
                        ok: true,
                        message: `update success.`
                    });
                }).catch(function (error) {
                    console.error("Error adding document: ", error);
                    reject({
                        ok: false,
                        message: error
                    });
                });

        })
    }

}

