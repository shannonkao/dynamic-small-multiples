// ADD top figure
// related work on visualization as an analysis tool
// actual sources in bibtex
// maybe figures for design iteration section 
// upload code to github, site to github.io

var margin = {top: 10, right: 10, bottom: 140, left: 40},
    margin2 = {top: 500, right: 10, bottom: 20, left: 40},
    width = 600 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    height2 = 600 - margin2.top - margin2.bottom;

    
var zeroAxis = 5;

var customTimeFormat = d3.time.format.multi([
  [".%L", function(d) { return d.getMilliseconds(); }],
  [":%S", function(d) { return d.getSeconds(); }],
  ["%I:%M", function(d) { return d.getMinutes(); }],
  ["%I %p", function(d) { return d.getHours(); }],
  ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
  ["%b %d", function(d) { return d.getDate() != 1; }],
  ["%b", function(d) { return d.getMonth(); }],
  ["%Y", function() { return true; }]
]);

function customTickFunction(t0, t1, dt)
{
    var labelSize = 60; 
    var maxTotalLabels = Math.floor(width / labelSize);
    
    function step(date, offset) {
        date.setMonth(date.getMonth() + offset);
    }
    
    var time = d3.time.month.ceil(t0), times = [], monthFactors = [1,3,6,9,12];
    
    while (time < t1) times.push(new Date(+time)), step(time, 1);
    var timesCopy = times;
    var i;
    for(i=0 ; times.length > maxTotalLabels ; i++)
        times = _.filter(timesCopy, function(d){
            return (d.getMonth()) % monthFactors[i] == 0;
        });
    return times;
}

function addMonths(date, count) {
  if (date && count) {
    var m, d = date.getDate()

    date.setMonth(date.getMonth() + count, 1)
    m = date.getMonth()
    date.setDate(d)
    if (date.getMonth() !== m) date.setDate(0)
  }
  return date;
}

var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]),
    y2 = d3.scale.linear().range([height2, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(customTimeFormat).ticks(customTickFunction),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left");

var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);

var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.temp_max); });
    
var area = d3.svg.area()
    //.interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y0(height-height/zeroAxis)
    .y1(function(d) { return y(d.temp_max); });
var area2 = d3.svg.area()
    //.interpolate("basis")
    .x(function(d) { return x2(d.date); })
    .y0(height2-height2/zeroAxis)
    .y1(function(d) { return y2(d.temp_max); });

var zoom = d3.behavior.zoom().on("zoom", zoomed);

var svg;
var focus, context, rect, tooltip;
var formatDate = d3.time.format("%Y-%m-%d");
var bisectDate = d3.bisector(function(d) { return d.date; }).left;
var dallas = [];
var previewRects = [];
var previewBeforeRects = [];
var multipleExtents = {};

var monthToPixel = 550/70;
var maxDate;

d3.json('data/weatherdata_detroit.json', function(error, data) {
    for (var i=0; i<data.length; i++) {
        if (Number(data[i].temp_max)) {
            dallas.push({
                        temp_max: Number(data[i].temp_max), 
                        date: formatDate.parse(data[i].date)
                    });
        }
    }
    maxDate = d3.extent(dallas.map(function(d) { return d.date; }))
    
    svg = d3.select("#container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    x.domain(maxDate);
    y.domain([-10, 40]);
    x2.domain(x.domain());
    y2.domain(y.domain());
    brush.extent([new Date(2010,00,01),  d3.time.day.offset(new Date(2010,5,1), 1)]);

    // Set up zoom behavior
    zoom.x(x)
        .translate([0,0])
        .scale(13.9);

    tooltip = svg.append("g")
      .attr("class", "tooltip")
      .style("display", "none");

    tooltip.append("circle")
      .attr("r", 4.5);

    tooltip.append("text")
      .attr("x", 9)
      .attr("dy", ".35em");

    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(dallas, x0, 1),
            d0 = dallas[i - 1],
            d1 = dallas[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            
        tooltip.attr("transform", "translate(" + (x(d.date) + margin.left) + "," + (y(d.temp_max) +margin.top) + ")");
        tooltip.select("text").text((d.temp_max) + "°C");
    }
    // Add rect cover the zoomed graph and attach zoom event.
    rect = svg.append("svg:rect")
        .attr("class", "pane")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom)
        .on("mouseover", function() { tooltip.style("display", ''); })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", mousemove);
        
    focus.append("path")
        .datum(dallas)
        .attr("class", "area dallas")
        .attr("d", area);
        
    focus.append('svg:path')
        .attr('class', 'line dallas')
        .attr("d", movingAverageLine(dallas));
    
    focus.append("rect")
        .attr("class", "cliprect")
        .attr("x", -margin.left)
        .attr("y", -margin.top)
        .attr("width", margin.left)
        .attr("height", height+margin.top+margin.bottom);
    context.append("rect")
        .attr("class", "cliprect")
        .attr("x", -margin.left)
        .attr("y", -margin.top)
        .attr("width", margin.left)
        .attr("height", height+margin.top+margin.bottom);
    
    focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    context.append("path")
      .datum(dallas)
      .attr("class", "area")
      .attr("d", area2);

    context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

    context.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", height2 + 7);
      
    
});
$( document ).ready(function() {
    function viewMultiple(evt) {

        $(".copy").removeClass('multipleSelected');
        d3.selectAll('.copy svg').select('g').select('rect').style('fill', 'white')
    
        var multId = evt.currentTarget.id;
        var mult = d3.select('#'+multId);
        
        brush.extent([multipleExtents[multId][0].toDate(),  d3.time.day.offset(multipleExtents[multId][1].toDate(), 1)]);
        brush(d3.select(".brush"));
        brush.event(d3.select(".brush"))
        
        $('#'+multId).addClass('multipleSelected')
        mult.select('g').select('rect').style('fill', '#f3f3f3')
    }
    
    function makeMultiple(i, moments) {
        var content = d3.select('#container').html();

        var div = d3.select('#multiples').append('div')
            .html(content);
        div.attr("id", "mult-"+i)
        div.attr('class', 'copy');
        $("#mult-"+i).dblclick(viewMultiple);
        
        var del = div.append('div').html('X');
        del.attr('class', 'deleteMultiple');
        del.on('click', function() {
            delete multipleExtents[this.parentNode.id];
            this.parentNode.remove();
        })
        
        var small_multiple = d3.select('#mult-'+i+' svg')
                               .attr("height", "200")
                               .attr("width", "260");
       
        var start_year = Number(moments[0].format('YYYY'))
        var end_year = moments[1].get('year');
        
        var next_year = moment({ year: start_year+1, month:0, day:1});
        
        var year_duration = next_year.diff(moments[0]);
        var total_duration = moments[1].diff(moments[0]);
        
        if (start_year != end_year && year_duration/total_duration < 0.25) start_year += 1;
        
        var text = small_multiple.append('text')
                                 .attr('x', 3)
                                 .attr('y', 15)
                                 .attr("font-size", "12px")
                                 .text(start_year);
                                 
        small_multiple.select('g')
                      .attr("transform", "scale(0.4) translate(40,0)")
                      .select('.y.axis').remove();
        multipleExtents["mult-"+i] = [moment(moments[0]), moment(moments[1])];
    }
    
    var idx = 0;
    function addAnother() {
        var space = Number($("#spacingSlider" ).slider( "value" ));
        var repeats = Number($( "#repeatSlider" ).slider( "value" ));
        var repeatsBefore = 10-Number($( "#repeatBeforeSlider" ).slider( "value" ));
        var initialExtents = brush.extent();
        var moments = [moment(brush.extent()[0]), moment(brush.extent()[1])];
        var size = initialExtents[1] - initialExtents[0];
        
        
        var start_moment = moments[0].subtract(size*repeatsBefore, 'milliseconds').subtract(space*repeatsBefore, 'months').add(1, 'days');
        var end_moment = moments[1].subtract(size*repeatsBefore, 'milliseconds').subtract(space*repeatsBefore, 'months').add(1, 'days');
        for (var i=0; i<repeatsBefore; i++) {
            var start_moment = moments[0].add(size, 'milliseconds').add(space, 'months').subtract(1, 'days');
            var end_moment = moments[1].add(size, 'milliseconds').add(space, 'months').subtract(1, 'days');
            brush.extent([start_moment.toDate(),  d3.time.day.offset(end_moment.toDate(), 1)]);
            brush(d3.select(".brush"));
            brush.event(d3.select(".brush"));
            
            if (moments[0].toDate() >= maxDate[0]) {    
                makeMultiple(idx, moments);
                idx += 1;
            }
        }

        moments = [moment(initialExtents[0]), moment(initialExtents[1])];
        makeMultiple(idx, moments);
        idx += 1; 
        
        for (var i=0; i<repeats; i++) {
            var start_moment = moments[0].add(size, 'milliseconds').add(space, 'months').subtract(1, 'days');
            var end_moment = moments[1].add(size, 'milliseconds').add(space, 'months').subtract(1, 'days');
            brush.extent([start_moment.toDate(),  d3.time.day.offset(end_moment.toDate(), 1)]);
            brush(d3.select(".brush"));
            brush.event(d3.select(".brush"));
            
            if (moments[1].toDate() <= maxDate[1]) {    
                makeMultiple(idx, moments);
                idx += 1;
            }
        }
        
        brush.extent(initialExtents);
        brush(d3.select(".brush"));
        brush.event(d3.select(".brush"))
    }
    $("#multiple").click(addAnother);
    $( "#multiples" ).sortable();
    $( "#multiples" ).disableSelection();
    
    $("#clear").click(function(){
        d3.selectAll('.copy').remove();
        for (var e in multipleExtents) delete multipleExtents[e];
    });
    
    var repeatAfter = 0;
    $(function() {
        $( "#repeatSlider" ).slider({
            value: 0,
            min: 0,
            max: 10,
            step: 1,
            slide: function( event, ui ) {
                repeatAfter = ui.value;
                $( "#repeatCount" ).text( repeatAfter+repeatBefore );
                
                var space = Number($("#spacingSlider" ).slider( "value" ))*monthToPixel;
                var offset = Number(d3.select('rect.extent').attr("width"));
                var initial = Number(d3.select('rect.extent').attr("x"));
                context.selectAll('.multipleRect.after').remove();
                previewRects.length = 0;
                
                for (var i=0; i<repeatAfter; i++) {
                    var r = context.append("rect")
                        .attr("class", "multipleRect after")
                        .attr("x", initial + Math.round((offset+space)*(i+1)))
                        .attr("y", -5)
                        .attr("width", Math.round(offset))
                        .attr("height", height2+6);
                        
                    previewRects.push(r);
                }
            }
        });
        $( "#repeatCount" ).text( $( "#repeatSlider" ).slider( "value" ) );
    });
    var repeatBefore = 0;
    $(function() {
        $( "#repeatBeforeSlider" ).slider({
            min: 0,
            max: 10,
            step: 1,
            value: 10,
            slide: function( event, ui ) {
                repeatBefore = 10-ui.value
                $( "#repeatCount" ).text( repeatBefore+repeatAfter );
                
                var space = Number($("#spacingSlider" ).slider( "value" ))*monthToPixel;
                var offset = Number(d3.select('rect.extent').attr("width"));
                var initial = Number(d3.select('rect.extent').attr("x"));
                context.selectAll('.multipleRect.before').remove();
                previewBeforeRects.length = 0;
                
                for (var i=0; i<repeatBefore; i++) {
                    var r = context.append("rect")
                        .attr("class", "multipleRect before")
                        .attr("x", initial - Math.round((offset+space)*(i+1)))
                        .attr("y", -5)
                        .attr("width", Math.round(offset))
                        .attr("height", height2+6);
                        
                    previewBeforeRects.push(r);
                }
            }
        });
        $( "#repeatCount" ).text( $( "#repeatSlider" ).slider( "value" ) );
    });

    $(function() {
        $( "#spacingSlider" ).slider({
            value:1,
            min: 0,
            max: 24,
            slide: function( event, ui ) {
                $( "#spacingCount" ).text( ui.value );
                var space = Number(ui.value)*monthToPixel;
                var offset = Number(d3.select('rect.extent').attr("width"));
                var initial = Number(d3.select('rect.extent').attr("x"));
                
                for (var i=0; i<previewRects.length; i++) {
                    previewRects[i].attr("x", initial + Math.round((offset+space)*(i+1)));
                }
                for (var i=0; i<previewBeforeRects.length; i++) {
                    previewBeforeRects[i].attr("x", initial - Math.round((offset+space)*(i+1)));
                }
            }
        });
        $( "#spacingCount" ).text( $( "#spacingSlider" ).slider( "value" ) );
    });

    $("#multiple").button();
    $("#clear").button();
    
});
        
var movingAvg = function(n) {
    return function (points) {
        points = points.map(function(each, index, array) {
            var to = index + n - 1;
            var subSeq, sum;
            if (to < points.length) {
                subSeq = array.slice(index, to + 1);
                sum = subSeq.reduce(function(a,b) { return [a[0] + b[0], a[1] + b[1]]; });
                return sum.map(function(each) { return each / n; });
            }
            return undefined;
        });
        points = points.filter(function(each) { return typeof each !== 'undefined' });
        // Transform the points into a basis line
        var pathDesc = d3.svg.line().interpolate("basis")(points)
        // Remove the extra "M"
        return pathDesc.slice(1, pathDesc.length);
    }
}

var movingAverageLine = d3.svg.line()
    .x(function(d,i) { return x(d.date); })
    .y(function(d,i) { return y(d.temp_max); })
    //.interpolate("basis");
    .interpolate(movingAvg(5));
var movingAverageArea = d3.svg.area()
    .x(function(d,i) { return x(d.date); })
    .y0(height-height/zeroAxis)
    .y1(function(d) { return y(d.temp_max); })
    //.interpolate("basis");
    //.interpolate(movingAvg(1));

function brushed() {
    $(".copy").removeClass('multipleSelected');
    d3.selectAll('.copy svg').select('g').select('rect').style('fill', 'white')

    //39.68600993213699 x/13.9 = y
    //550 x/1 = y
    
    var pxMin = 39.68600993213699;
    var pxMax = 550;
    var w = Number(d3.select('rect.extent').attr("width"));
    var s = 550/w;//(1 - (w - pxMin)/(pxMax-pxMin)) *12.9 +1;

    movingAverageLine = d3.svg.line()
        .x(function(d,i) { return x(d.date); })
        .y(function(d,i) { return y(d.temp_max); })
        //.interpolate("basis");
        .interpolate(movingAvg(Math.max(Math.round(20/s),5)));
        
    x.domain(brush.empty() ? x2.domain() : brush.extent());
    focus.select(".area").attr("d", area);
    focus.select(".line").attr("d", movingAverageLine(dallas));
    focus.select(".x.axis").call(xAxis);
  
    zoom.x(x); 
        
    var space = Number($("#spacingSlider" ).slider( "value" ))*monthToPixel;
    var offset = Number(d3.select('rect.extent').attr("width"));
    var initial = Number(d3.select('rect.extent').attr("x"));
    for (var i=0; i<previewRects.length; i++) {
        previewRects[i].attr("x", initial + Math.round((offset+space)*(i+1)));
        previewRects[i].attr("width", offset);
    }
    for (var i=0; i<previewBeforeRects.length; i++) {
        previewBeforeRects[i].attr("x", initial - Math.round((offset+space)*(i+1)));
        previewBeforeRects[i].attr("width", offset);
    }
}
var prevX = 0;
var prevY = 0;
function zoomed() {
    $(".copy").removeClass('multipleSelected');
    d3.selectAll('.copy svg').select('g').select('rect').style('fill', 'white')

    
    //var s = zoom.scale();
    var t = zoom.translate(),
        tx = t[0],
        ty = t[1];

    /*tx = Math.min(tx, 0);
    tx = Math.max(tx, width-width*s);
    ty = Math.min(ty, 0);
    ty = Math.max(ty, height-height*s);
    if (d3.event.sourceEvent.button == 2)  {
        zoom.translate([prevX, prevY]);
    } else {
        zoom.translate([tx, ty]);
        prevX = tx;
        prevY = ty;
    }*/
    
    
    //var focus_width = Number(d3.select('g.focus').node().getBBox().width) // 550 min
    //var focus_x = Number(d3.select('g.focus').node().getBBox().x) // -40 default
    
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    brush.extent(x.domain());
    svg.select(".brush").call(brush);

    var pxMin = 39.68600993213699;
    var pxMax = 550;
    var w = Number(d3.select('rect.extent').attr("width"));
    var s = 550/w;//(1 - (w - pxMin)/(pxMax-pxMin)) *12.9 +1;

    
    
    movingAverageLine = d3.svg.line()
        .x(function(d,i) { return x(d.date); })
        .y(function(d,i) { return y(d.temp_max); })
        //.interpolate("basis");
        .interpolate(movingAvg(Math.max(Math.round(20/s),5)));
    movingAverageArea = d3.svg.area()
        .x(function(d,i) { return x(d.date); })
        .y0(height-height/zeroAxis)
        .y1(function(d) { return y(d.temp_max); })
        //.interpolate("basis");
        //.interpolate(movingAvg(Math.max(Math.round(20/s),1)));

    svg.select(".area.dallas")
        .attr("d", movingAverageArea(dallas));
    svg.select('.line.dallas')
        .attr("d", movingAverageLine(dallas));
        
    var space = Number($("#spacingSlider" ).slider( "value" ))*monthToPixel;
    var offset = Number(d3.select('rect.extent').attr("width"));
    var initial = Number(d3.select('rect.extent').attr("x"));
    for (var i=0; i<previewRects.length; i++) {
        previewRects[i].attr("x", initial + Math.round((offset+space)*(i+1)));
        previewRects[i].attr("width", offset);
    }
    for (var i=0; i<previewBeforeRects.length; i++) {
        previewBeforeRects[i].attr("x", initial - Math.round((offset+space)*(i+1)));
        previewBeforeRects[i].attr("width", offset);
    }
}
