const d3 = require('d3');

export default function histogram() {
    var data = new Array() // data for the histogram, initially empty
        ,margin = { top: 30, right: 30, bottom: 30, left: 50 }
        ,width = 1000
        ,height = 200
        ,fillColor = 'steelblue'
        ,xAxis
        ,yAxis
        ,x
        ,y
        ,Nbin = 24 // The number of bins
        ,svg
        ,bars
        ,gBrushes
        ,updateData;

    const dispatch = d3.dispatch('range');

    const brush = d3.brushX();

    const formatMinutes = function(d) {
        var hours = Math.floor(d / 60),
            minutes = Math.floor(d - hours*60),
            output = '';
        if (minutes) {
            output = minutes + 'm ';
        }
        if (hours) {
            if(hours <= 12)
                output = hours + output + ' AM';
            else
                output = hours - 12 + output + ' PM';
        }
        return output;
    };

    function brushed({selection}) {
        if (selection != null) {
            const selectedTime = selection.map(d => x.invert(d));
            dispatch.call('range', this, selectedTime);
        }
    }

    function dblclicked() {
        gBrushes.call(d3.brushX().clear);
        dispatch.call('range', this, []);
    }

    function chart(selection){

        selection.each(function() {

            brush
                .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom ]])
                .on("end", brushed);

            svg = d3
                .select(this)
                .append("svg")
                .attr("viewBox", [0, 0, width, height])

            x = d3.scaleLinear()
                .domain([1, 1440])
                .range([margin.left, width - margin.right]);

            xAxis = d3.axisBottom(x)
                .tickFormat(formatMinutes)
                .tickValues(d3.range(0, 1440, 60));

            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(xAxis);

            const histogram = d3
                .histogram()
                .domain(x.domain())
                .thresholds(x.ticks(Nbin));

            const bins = histogram(data);

            y = d3.scaleLinear()
                .domain([0, Math.max(1, d3.max(bins, function (d) {
                    return d.length;
                }))])
                .range([height - margin.bottom, margin.top]);

            yAxis = svg.append("g")
                .attr("transform", `translate(${margin.left},0)`);

            bars = svg.selectAll(".bar")
                .data(bins)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", 1)
                .attr("transform", function(d) {
                    return "translate(" + x(d.x0) + "," + y(d.length) + ")";
                })
                .attr("width", function(d) {
                    return x(d.x1) - x(d.x0) - 1;
                })
                .attr("height", function(d) {
                    return height - margin.bottom - y(d.length);
                })
                .style("fill", fillColor);

            gBrushes = svg.append("g")
                .attr("class", "brush")
                .call(brush)
                .on("dblclick", dblclicked); // on double click remove the current brush

            updateData = function () {

                const histogram = d3
                    .histogram()
                    .domain(x.domain())
                    .thresholds(x.ticks(Nbin));

                const bins = histogram(data);

                y.domain([0, Math.max(1, d3.max(bins, function (d) {
                    return d.length;
                    }))]);

                yAxis.transition()
                    .duration(1000)
                    .call(d3.axisLeft(y));

                bars.data(bins);

                bars
                    .enter()
                    .append("rect")
                    .merge(bars)
                    .transition()
                    .duration(1000)
                    .attr("class", "bar")
                    .attr("x", 1)
                    .attr("transform", function(d) {
                        return "translate(" + x(d.x0) + "," + y(d.length) + ")";
                    })
                    .attr("width", function (d) {
                        return x(d.x1) - x(d.x0) - 1;
                    })
                    .attr("height", function (d) {
                        return height - margin.bottom - y(d.length);
                    })
                    .style("fill", fillColor);

                bars.exit().remove();
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

    chart.on = (eventType, handler) => {
        dispatch.on(eventType, handler);

        return chart;
    };

    return chart;

}