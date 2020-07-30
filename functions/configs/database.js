const mysql = require('mysql');
const address = {
    host: '71dc0845e788.sn.mynetname.net',
    user: 'ilario',
    password: 'IlarioBolla1971',
    database: 'sibylla',
    charset: 'utf8'
}

 
const connection = mysql.createPool(address)

connection.getConnection((err, connect) => {
    if(err) console.log(err)
})

module.exports = connection;