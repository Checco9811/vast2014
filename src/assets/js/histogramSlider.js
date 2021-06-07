const d3 = require('d3');

export default function histogram() {
    var data = [1, 1440] // data for the histogram
        ,margin = { top: 30, right: 0, bottom: 30, left: 0 }
        ,width = 1000
        ,height = 100
        ,fillColor = 'steelblue'
        ,xAxis
        ,yAxis
        ,min = d3.min(data)
        ,max = d3.max(data)
        ,domain = [min,max]
        ,x
        ,y
        ,Nbin = 24 // The number of bins
        ,svg
        ,bar
        ,gBrushes
        ,updateData;

    const dispatch = d3.dispatch('range');

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", brushed);

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
            svg = d3
                .select(this)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x = d3.scaleLinear()
                .domain(domain)
                .range([0, width]);

            xAxis = d3.axisBottom(x)
                .tickFormat(formatMinutes)
                .tickValues(d3.range(0, d3.max(data), 60));

            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            y = d3.scaleLinear()
                .range([height, 0]);

            yAxis = svg.append("g");

            var histogram = d3
                .histogram()
                .domain(x.domain())
                .thresholds(x.ticks(Nbin));
            var bins = histogram(data);

            bar = svg.selectAll(".bar")
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
                    return height - y(d.length);
                })
                .style("fill", fillColor);

            gBrushes = svg.append("g")
                .attr("class", "brush")
                .call(brush)
                .on("dblclick", dblclicked); // on double click remove the current brush

            updateData = function () {

                var histogram = d3
                    .histogram()
                    .domain(x.domain())
                    .thresholds(x.ticks(Nbin));

                var bins = histogram(data);

                y.domain([0, d3.max(bins, function (d) {return d.length;})]);

                yAxis.transition()
                    .duration(1000)
                    .call(d3.axisLeft(y));

                bar.data(bins);

                bar
                    .enter()
                    .append("rect")
                    .merge(bar)
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
                        return height - y(d.length);
                    })
                    .style("fill", fillColor);

                bar.exit().remove();
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

    chart.resize = function(_) {
        const resize = _/width;
        svg = svg.attr("transform", "scale("+ (resize) +",1)")
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