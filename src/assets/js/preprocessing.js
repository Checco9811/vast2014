//split a gps array if two consecutive elements have a difference > threshold (milliseconds)
exports.splitTrajectories = (data, threshold= 600000) => {
    const result = [];
    var tmp = [];

    for (var i = 0; i < data.length - 1; i++) {
        tmp.push(data[i]);
        if (data[i + 1].Timestamp - data[i].Timestamp > threshold) {
            result.push(tmp);
            tmp = [];
        }
    }
    result.push(tmp);

    return result;
}

exports.formatMinutes = (d) => {
    const hours = Math.floor(d / 60),
        minutes = Math.floor(d - hours * 60);

    if (hours <= 12)
        return hours + ":" + minutes + ' AM';
    else
        return hours - 12 + ":" + minutes + ' PM';
}


exports.join = (lookupTable, mainTable, lookupKey, mainKey, select) => {
    var l = lookupTable.length,
        m = mainTable.length,
        lookupIndex = [],
        output = [];
    for (var i = 0; i < l; i++) { // loop through l items
        var row = lookupTable[i];
        lookupIndex[row[lookupKey]] = row; // create an index for lookup table
    }
    for (var j = 0; j < m; j++) { // loop through m items
        var y = mainTable[j];
        var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
        output.push(select(y, x)); // select only the columns you need
    }
    return output;
}

exports.formatDate = (date) => {
    const dateString = date.toISOString().split("T");
    const d1 = dateString[0];
    const d2 = dateString[1].split(".")[0];
    return d1 + ' ' + d2;
}
