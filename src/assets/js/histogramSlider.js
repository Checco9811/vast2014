const d3 = require('d3');

export default function histogram() {
    const dispatch = d3.dispatch('range');

    var data = [1,1440];
    var margin = { top: 30, right: 30, bottom: 30, left: 50 };
    var width = 1000;
    var height = 100;
    var fillColor = 'steelblue';
    var xAxis;
    var yAxis;

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", brushed);

    var min = d3.min(data);
    var max = d3.max(data);
    var domain = [min,max];
    var x;
    var y;

    var onBrushed = function (){};

    // The number of bins
    var Nbin = 24;

    var svg;
    var bar;

    var updateData;

    function brushed({selection}) {
        if (selection != null) {
            const selectedTime = selection.map(d => x.invert(d));
            //onBrushed(selectedTime);
            dispatch.call('range', this, selectedTime);
        }
    }

    var formatMinutes = function(d) {
        var hours = Math.floor(d / 60),
            minutes = Math.floor(d - hours*60),
            output = '';
        if (minutes) {
            output = minutes + 'm ';
        }
        if (hours) {
            output = hours + 'h ' + output;
        }
        return output;
    };

    function chart(selection){

        selection.each(function(){

            x = d3.scaleLinear()
                .domain(domain)
                .range([0, width]);

            var histogram = d3
                .histogram()
                .domain(x.domain()) // then the domain of the graphic
                .thresholds(x.ticks(Nbin)); // then the numbers of bins

            // And apply this function to data to get the bins
            var bins = histogram(data);

            y = d3.scaleLinear()
                .range([height, 0])
                .domain([0, d3.max(bins, function(d) {
                    return d.length;})
                ]);

            yAxis = d3.axisLeft(y);

            // Add the svg element to the body and set the dimensions and margins of the graph
            svg = d3
                .select(this)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            xAxis = d3.axisBottom(x)
                .tickFormat(formatMinutes)
                .tickValues(d3.range(0, d3.max(data), 60));

            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y-axis")
                .call(yAxis);

            bar = svg.selectAll(".bar")
                .data(bins)
                .enter()
                .append("g")
                .attr("class", "bar")
                .attr("transform", function(d) {
                    return "translate(" + x(d.x0) + "," + y(d.length) + ")";
                });

            bar.append("rect")
                .attr("x", 1)
                .attr("width", function(d) {
                    return x(d.x1) - x(d.x0) - 1;
                })
                .attr("height", function(d) {
                    return height - y(d.length);
                })
                .style("fill", fillColor);

            svg.append("g")
                .call(brush);

            updateData = function() {
                var newHistogram = d3
                    .histogram()
                    .domain(x.domain()) // then the domain of the graphic
                    .thresholds(x.ticks(Nbin));// then the numbers of bins

                // And apply this function to data to get the bins
                var bins = newHistogram(data);

                y = d3.scaleLinear()
                    .range([height, 0])
                    .domain([0, d3.max(bins, function(d) {
                        return d.length;})
                    ]);

                yAxis = d3.axisLeft(y);

                d3.select('g.y-axis ').call(yAxis);

                bar.data(bins)
                    .transition()
                    .duration(500)
                    .attr("transform", function(d) {
                        return "translate(" + x(d.x0) + "," + y(d.length) + ")";
                    })
                    .select("rect")
                    .attr("width", function(d) {
                        return x(d.x1) - x(d.x0) - 1;
                    })
                    .attr("height", function(d) {
                        return height - y(d.length);
                    })
                    .style("fill", fillColor);

            }

        });

    }

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;
    };


    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.onBrushed = function(_) {
        if (!arguments.length) return onBrushed;
        onBrushed = _;
        return chart;
    };

    chart.on = (eventType, handler) => {
        dispatch.on(eventType, handler);

        return chart;
    };

    return chart;

}