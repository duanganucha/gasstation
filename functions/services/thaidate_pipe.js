module.exports = {

    convertDate(date, format) {
        var ThaiDay = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
        var shortThaiMonth = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        var longThaiMonth = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        var inputDate = new Date(date);
        var dataDate = [
            inputDate.getDay(), inputDate.getDate(), inputDate.getMonth(), inputDate.getFullYear()
        ];
        console.log(date)
        var outputDateFull = [
            'วัน ' + ThaiDay[dataDate[0]],
            'ที่ ' + dataDate[1],
            ' ' + longThaiMonth[dataDate[2]],
            'พ.ศ. ' + (dataDate[3] + 543)
        ];
        var outputDateShort = [
            dataDate[1],
            shortThaiMonth[dataDate[2]],
            dataDate[3] + 543
        ];
        var outputDateMedium = [
            dataDate[1],
            longThaiMonth[dataDate[2]],
            dataDate[3] + 543
        ];
        var returnDate = ''
        returnDate = outputDateMedium.join(" ");
        if (format == 'full') {
            returnDate = outputDateFull.join(" ");
        }
        if (format == 'medium') {
            returnDate = outputDateMedium.join(" ");
        }
        if (format == 'short') {
            returnDate = outputDateShort.join(" ");
        }
        return returnDate;
    }
}