

const mysql = require('mysql');
const address = {
   
}

const connection = mysql.createPool(address)

connection.getConnection((err, connect) => {
    (err) ? console.log(err) : console.log('connection database 1')
})


module.exports = {

    fetchDataDelivery(tank_id) {
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM delivery WHERE tank_id=?',[tank_id],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length[result]);
                    resolve(result[result.length - 1]);
                })
        })
    },
    fetchDataAlarm(alarm_status){
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM alarms_log WHERE alarm=?',[alarm_status],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length[result]);
                    resolve(result[result.length - 1]);
                })
        })
    },
    fetchDataHistoryLog(tank_id){
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM history_log WHERE tank_id=?',[tank_id],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length[result]);
                    resolve(result[result.length - 1]);
                })
        })
    }

}
