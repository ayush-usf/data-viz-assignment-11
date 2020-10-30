const chartAreaHeight = 420
const chartAreaWidth = 1200

const margin = {top: 50, right: 50, bottom: 70, left: 150}
const width = chartAreaWidth - margin.left - margin.right;
const height = chartAreaHeight - margin.top - margin.bottom;
let min = undefined, max = undefined;

// Tooltip :  https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7
let tooltip = d3.select("body").append("div").attr("class", "toolTip");

// Creating svg (canvas)
const svg = d3.select("#chart-area").append("svg")
    .attr("width", width)
    .attr("height", height);

// Creating groups
const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top} )`);

const monthsArr = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const citiesDict = {
    "ATL": "Atlanta",
    "BOS": "Boston",
    "BWI": "Baltimore",
    "CLT": "Charlotte",
    "DCA": "Washington"
}

const monthDict = {
    "01": "January",
    "02": "Febuary",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
}

let plotData = [];
const airportCodes = ["New York","San Francisco","Austin"];

// Extracting data from CSV - async IIFE
( async ()=>{
    try{
        let map = {}
        const data = await d3.tsv("data.tsv")
        data.forEach(i=>{
            let key = i.date.substring(4,6)
            if(!map[key]){
                map[key] = []
            }
            map[key].push(i)
        })
        let plotData2 = []
        Object.keys(map).forEach((month) =>{
            let dict = {}
            dict["New York"] = 0
            dict["San Francisco"] = 0
            dict["Austin"] = 0
            let len = map[month].length;
            map[month].forEach(data=>{
                dict["New York"] += +data["New York"]
                dict["San Francisco"] += +data["San Francisco"]
                dict["Austin"] += +data["Austin"]
            })
            console.log("dict",dict);
            dict["New York"] = dict["New York"]/len
            dict["San Francisco"] = dict["San Francisco"]/len
            dict["Austin"] = dict["Austin"]/len
            const minVal = Math.min.apply(null,Object.values(dict))
            const maxVal = Math.max.apply(null,Object.values(dict))
            if(min){
                if(min > minVal)
                    min = minVal;
            }
            else{
                min = minVal;
            }
            if(max){
                if(max < maxVal)
                    max = maxVal;
            }
            else{
                max = maxVal;
            }

            Object.keys(dict).forEach(city=>{
                plotData2.push({group:monthDict[month], value:Math.round(dict[city]), variable:city})
            })
        })
        console.log("plotData2",plotData2);
        console.log("map",map);
        const avgFlightDelMinByCityMonth = d3.rollup(data,
                d => d3.mean(d, v=>v["Statistics.Minutes Delayed.Weather"]),
                d => d["Airport.Code"], // Group by 1
                d => d[["Time.Month Name"]]); // Group by 2

        drawBarChart(plotData2);
    }
    catch (e){
        console.error("Error : ", e)
    }
})()

// Rendering the bar chart
function drawBarChart(data) {

    // Ref (Heatmap) : https://www.d3-graph-gallery.com/graph/heatmap_style.html
    const myColor = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([min,max])

    const defs = g.append("defs");

    let linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "100%");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", myColor(min));

    linearGradient.append("stop")
        .attr("offset", "25%")
        .attr("stop-color", myColor(max * 0.25));

    linearGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", myColor(max * 0.75));

    linearGradient.append("stop")
        .attr("offset", "75%")
        .attr("stop-color", myColor(max * 0.75));

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", myColor(max));

    g.append("rect")
        .attr("x", 50)
        .attr("y", - 20)
        .attr("width", width - 320)
        .attr("height", 10)
        // .style("stroke", "black")
        // .style("stroke-width", 2)
        .style("fill", "url(#linear-gradient)")

    g.append("text")
        .attr("class",  "min-value")
        .attr("x",  -30)
        .attr("y", -10)
        .text(Math.round(min) +" (min)")

    g.append("text")
        .attr("class",  "max-value")
        .attr("x",   width - 260)
        .attr("y", -10)
        .text(Math.round(max) +" (max)")

    // X axis label
    // Ref: text label for the x axis (https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e)
    g.append("text")
        .attr("class", "x axis-label")
        .attr("x",  width / 3 + 65)
        .attr("y", height - margin.bottom + 20)
        .attr("font-size", "15px")
        .attr("text-anchor", "middle")
        .text("Month")

    // scaleBand is used to position many visual elements in a particular order with even spacing
    // ref: http://daydreamingnumbers.com/learn-d3/bar-charts-in-d3/
    // https://github.com/d3/d3-scale/blob/master/README.md#scaleBand
    // https://github.com/d3/d3-scale/blob/master/README.md#band_paddingInner
    const xAxisRange = d3.scaleBand()
        .domain(monthsArr)
        .range([0, width - margin.right - margin.left])
        .padding(0.05);

    const xAxisCall = d3.axisBottom(xAxisRange)
                    .tickSize(0)

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${3*height/4})`)
        .call(xAxisCall)        // https://stackoverflow.com/questions/12805309/javascript-library-d3-call-function
        .selectAll("text")      // https://stackoverflow.com/questions/12805309/javascript-library-d3-call-function
        .attr("y", "10")        //  https://stackoverflow.com/questions/41193617/group-each-rect-and-text-in-d3#answer-41193711
        .attr("x", "-5")
        .attr("text-anchor", "middle")
        .select(".domain").remove();

    // Scaling y-axis data
    const yAxisRange = d3.scaleBand()
        .domain(airportCodes)
        .range([3*height/4, 0])
        .padding(0.05);

    // Creating y-axis
    // https://www.tutorialsteacher.com/d3js/axes-in-d3
    // https://observablehq.com/@d3/axis-ticks
    // tickFormat => https://github.com/d3/d3-axis#axis_tickFormat
    const yAxisCall = d3.axisLeft(yAxisRange)
        .ticks(6)
        .tickFormat(d =>{

            return d;
        })

    g.append("g")
        .attr("class", "y axis")
        .call(yAxisCall)

    // Y label
    g.append("text")
        .attr("class", "y axis-label")
        .attr("x", - ( height / 3))
        .attr("y", -100)
        .attr("font-size", "15px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Cities")


        g.selectAll()
        .data(data, function(d) {return d.group+':'+d.variable;})
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xAxisRange(d.group) })
        .attr("y", function(d) {
            return yAxisRange(d.variable) })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", xAxisRange.bandwidth() )
        .attr("height", yAxisRange.bandwidth() )
        .style("fill", function(d) {
            return myColor(d.value)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 0.8)
        .on("mousemove", function(event, d){
            tooltip
                .style("left", event.pageX - 100 + "px")
                .style("top", event.pageY - 90 + "px")
                .style("display", "inline-block")
                .html("City: " + (d.variable) + "<br>Month: "+  d.group + "<br>Temperature: "+ (d.value));
        })
        .on("mouseout", function(d){ tooltip.style("display", "none");});


    // // Adding chart label
    g.append("text")
        .attr("class", "chart-label")
        .attr("x",  3 * width / 8)
        .attr("y", -35)
        .text("Temparature Levels in 3 cities (2012)")
}

