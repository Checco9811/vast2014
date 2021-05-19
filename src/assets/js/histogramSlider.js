const d3 = require('d3');

export default function histogram() {
    var margin = { top: 30, right: 30, bottom: 30, left: 50 };
    var width = 1000;
    var height = 100;
    var fillColor = 'steelblue';

    var onBrushed = function (){};

    // The number of bins
    var Nbin = 24;

    function chart(selection){

        selection.each(function(data){
            const brush = d3.brushX()
                .extent([[0, 0], [width, height]])
                .on("start brush end", brushed);

            var min = d3.min(data);
            var max = d3.max(data);
            // eslint-disable-next-line no-unused-vars
            var domain = [min,max];

            var x = d3.scaleLinear()
                .domain([1,1440])
                .range([0, width]);

            var histogram = d3
                .histogram()
                .domain(x.domain()) // then the domain of the graphic
                .thresholds(x.ticks(Nbin)); // then the numbers of bins

            // And apply this function to data to get the bins
            var bins = histogram(data);

            // Add the svg element to the body and set the dimensions and margins of the graph
            var svg = d3
                .select(this)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

            var xAxis = d3.axisBottom(x)
                .tickFormat(formatMinutes)
                .tickValues(d3.range(0, d3.max(data), 60));

            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            var y = d3.scaleLinear()
                .range([height, 0])
                .domain([0, d3.max(bins, function(d) {
                    return d.length;})
                ]);

            svg.append("g").call(d3.axisLeft(y));

            svg.selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", function(d) {
                    return "translate(" + x(d.x0) + "," + y(d.length) + ")";
                })
                .attr("width", function(d) {
                    return x(d.x1) - x(d.x0) - 1;
                })
                .attr("height", function(d) {
                    return height - y(d.length);
                })
                .style("fill", fillColor);

            svg.append("g")
                .call(brush);

            function brushed({selection}) {
                if (selection != null) {
                    const selectedTime = selection.map(d => x.invert(d));
                    onBrushed(selectedTime);
                }
            }

        });

    }

    //Accessors//
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

    return chart;

}