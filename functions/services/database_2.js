

const mysql = require('mysql');
const address = {
   
}

const connection = mysql.createPool(address)

connection.getConnection((err, connect) => {
    (err) ? console.log(err) : console.log('connection database 2')
})


module.exports = {

    fetchDataDelivery(tank_id) {
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM delivery WHERE tank_id=? ORDER BY end_dlv ASC' ,[tank_id],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length[result]);
                    resolve(result[result.length - 1]);
                })
        })
    },
    fetchDataAlarm(alarm_status){
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM alarms_log WHERE alarm=? AND status=? ORDER By `data` ASC',[alarm_status,1],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length);
                    // resolve(result[0]);
                    resolve(result[result.length - 1]);
                })
        })
    },
    fetchDataHistoryLog(tank_id){
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM history_log WHERE tank_id=? ORDER By `data` ASC' ,[tank_id],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length[result]);
                    resolve(result[result.length - 1]);
                })
        })
    },
    fetchDataAlarmWater(alarm_status){
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM alarms_log WHERE alarm=? AND status=? ORDER By `data` ASC',[alarm_status,1],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length);
                    // resolve(result[0]);
                    resolve(result[result.length - 1]);
                })
        })
    },
    fetchDataHistoryVolumnWaterLog(tank_id){
        return new Promise((resolve, reject) => {
            connection
                .query('SELECT * FROM history_log WHERE tank_id=? AND h2o_lt > 0   ORDER By `data` ASC',[tank_id],(error, result) => {
                    if (error) return reject(error);
                    // resolve(result.length[result]);
                    resolve(result[result.length - 1]);
                })
        })
    }

}
