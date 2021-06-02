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
    var dateString = date.toISOString().split("T");
    const d1 = dateString[0];
    const d2 = dateString[1].split(".")[0];
    return d1 + ' ' + d2;
}

exports.fromFlatToHierarchy = (data, levels) => {
    const root = { name :"root", children : [] };
    // For each data row, loop through the expected levels traversing the output tree
    data.forEach(function(d){
        // Keep this as a reference to the current level
        var depthCursor = root.children;
        // Go down one level at a time
        levels.forEach(function( property, depth ){

            // Look to see if a branch has already been created
            var index;
            depthCursor.forEach(function(child,i){
                if ( d[property] == child.name ) index = i;
            });
            // Add a branch if it isn't there
            if ( isNaN(index) ) {
                depthCursor.push({ name : d[property], children : []});
                index = depthCursor.length - 1;
            }
            // Now reference the new child array as we go deeper into the tree
            depthCursor = depthCursor[index].children;
            // This is a leaf, so add the last element to the specified branch
            if ( depth === levels.length - 1) depthCursor.push({ name : d.location, value : d.count });
        });
    });

    return root;
}