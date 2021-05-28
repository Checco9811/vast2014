const d3 = require('d3');

export default function histogram() {
    const dispatch = d3.dispatch('range');

    var data = [] // data for the histogram
        ,margin = { top: 30, right: 30, bottom: 30, left: 50 }
        ,width = 1100
        ,height = 80
        ,fillColor = 'steelblue'
        ,xAxis
        ,yAxis
        ,min = d3.min(data)
        ,max = d3.max(data)
        ,domain = [min,max]
        ,x
        ,y
        ,Nbin = 24*14 // The number of bins
        ,svg
        ,bar
        ,updateData
        ,brushes = []
        ,gBrushes;

    function newBrush() {
        var brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("end", brushend);

        brushes.push({id: brushes.length, brush: brush});

        function brushend() {

            // Figure out if our latest brush has a selection
            var lastBrushID = brushes[brushes.length - 1].id
            var lastBrush = document.getElementById('brush-' + lastBrushID);
            var selection = d3.brushSelection(lastBrush);

            var selections = [];

            brushes.forEach(d => {
                var id = d.id;
                var selection = d3.brushSelection(document.getElementById('brush-' + id));
                if (selection !== null){
                    selections.push(selection.map(d => x.invert(d)));
                    dispatch.call('range', this, selections);
                }

            })

            // If it does, that means we need another one
            if (selection && selection[0] !== selection[1]) {
                newBrush();
            }
            // Always draw brushes
            drawBrushes();
        }
    }

    function drawBrushes() {

        var brushSelection = gBrushes
            .selectAll('.brush')
            .data(brushes, function (d){return d.id});

        // Set up new brushes
        brushSelection.enter()
            .insert("g", '.brush')
            .attr('class', 'brush')
            .attr('id', function(brush){ return "brush-" + brush.id; })
            .each(function(brushObject) {
                brushObject.brush(d3.select(this));
            });

        /* REMOVE POINTER EVENTS ON BRUSH OVERLAYS
         *
         * This part is abbit tricky and requires knowledge of how brushes are implemented.
         * They register pointer events on a .overlay rectangle within them.
         * For existing brushes, make sure we disable their pointer events on their overlay.
         * This frees the overlay for the most current (as of yet with an empty selection) brush to listen for click and drag events
         * The moving and resizing is done with other parts of the brush, so that will still work.
         */
        brushSelection
            .each(function (brushObject){
                d3.select(this)
                    .attr('class', 'brush')
                    .selectAll('.overlay')
                    .style('pointer-events', function() {
                        var brush = brushObject.brush;
                        if (brushObject.id === brushes.length-1 && brush !== undefined) {
                            return 'all';
                        } else {
                            return 'none';
                        }
                    });
            }).on("dblclick", dblclicked);

        function dblclicked() {
            brushSelection.call(d3.brushX().clear);
            brushes.splice(0,brushes.length);
            newBrush();
            dispatch.call('range', this, []);
        }

        brushSelection.exit()
            .remove();
    }

    function chart(selection){

        console.log(width);
        /*
        const boundaries = selection.node().parentNode.getBoundingClientRect();
        width = boundaries.width;

         */

        selection.each(function() {
            svg = d3
                .select(this)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x = d3.scaleLinear()
                .domain([+new Date(2014, 0, 6), +new Date(2014, 0, 19)])
                .range([0, width]);

            xAxis = d3.axisBottom(x)
                .ticks(14)
                .tickFormat(d3.timeFormat("%b %d, %y"))

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

            gBrushes = svg.append('g')
                .attr("class", "brushes")

            newBrush();
            drawBrushes();

            updateData = function () {

                var histogram = d3
                    .histogram()
                    .domain(x.domain())
                    .thresholds(x.ticks(Nbin));

                var bins = histogram(data);

                y.domain([0, d3.max([1,d3.max(bins, function (d) {
                    return d.length;})
                ])]);

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