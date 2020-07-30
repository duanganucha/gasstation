var moment = require('moment');

module.exports = {
  
    returnFunction(){

        return new Promise((resolve, reject) => {
            resolve(getTimeMoment())
        })

     }
   
}


function getTimeMoment() {
    var current_time = moment().utcOffset(7)
    current_time = current_time.format('DD-MM-YYYY, HH:mm:ss a');
    return current_time;
}