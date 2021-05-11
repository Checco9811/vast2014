/**
 *
 *  This module will display a map with a symbol encoding for a set of geographical elements
 */

const d3 = require('d3');

export default function BuildMap() {
    let projection = d3.geoMercator();
    let scale = 400000; // default value for scale
    let center = [24.864487, 36.070512]; // default value for centering the map
    let path;
    let featureClass = "id";

    function me(selection) {
        console.log('Map', selection.datum().features);

        const boundaries = selection.node().parentNode.getBoundingClientRect();
        //console.log('dimensions', boundaries);

        projection = d3.geoMercator()
            .scale(scale)
            .center(center)
            .translate([boundaries.width / 2, boundaries.height / 2]);

        path = d3.geoPath().projection(projection);

        // create a group container for map
        const paths = selection.selectAll('path')
            .data(selection.datum().features);

        paths.exit().remove();

        paths.enter()
            .append('path');

        selection.selectAll('path')
            .attr('class', (d) => {
                if (d.properties[featureClass]) {
                    return d.properties[featureClass];
                }
                return 'none';
            })
            .attr('d', path);

    }


    // getter and setter for variable scale
    me.scale = function (_) {
        if (!arguments.length) return scale;
        scale = _;
        projection.scale(scale);

        return me;
    };

    // getter and setter for variable center
    me.center = function (_) {
        if (!arguments.length) return center;
        center = _;
        projection.center(center);

        return me;
    };


    // getter and setter for variable center
    me.featureClass = function _featureClass(_) {
        if (!arguments.length) return featureClass;
        featureClass = _;

        return me;
    };


    return me;
}
