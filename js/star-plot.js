import data from '../data.json' assert { type: 'json' };

let width = parseInt(d3.select('#star-plot').style('width'), 10);
let height = parseInt(d3.select('#star-plot').style('height'), 10);
let idleOpacity = 0.5;
let idleWidth = 4;
let pointRadius = 5;

let names = data.map(d => d.name); // like ["Thor", "IronMan", "Hulk", ...]
let variables = Object.keys(data[0]);  // like ["strength", "intelligence", "speed", ...]
variables.splice(variables.indexOf("name"), 1);

// Accessor functions

// 1: Calculate the domain for the radialScale based on the data
const maxStatValue = Math.max(
  ...data.map(item =>
    Math.max(item.strength, item.intelligence, item.speed, item.agility, item.endurance)
  )
);
const minStatValue = Math.min(
  ...data.map(item =>
    Math.min(item.strength, item.intelligence, item.speed, item.agility, item.endurance)
  )
);

// 2: Calculate the coordinates for each path
function getPathCoordinates(data_point) {
  let coordinates = [];
  for (var i = 0; i < variables.length; i++) {
    let ft_name = variables[i];
    let angle = (Math.PI / 2) + (2 * Math.PI * i / variables.length);
    coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
  }
  return coordinates;
}

// 3: Get lighter color from a given color
function lighterColor(color) {
  const c = d3.color(color);
  c.opacity = c.opacity - .4;
  return c.toString();
}

// 4: left on click function star-plot
function on_click(event, d) {
  const g = svg.selectAll("g");

  g.selectAll("path")
    .attr("fill", "none")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", idleWidth)
    .attr("opacity", idleOpacity);

  g.selectAll(".pathDots")
    .attr("r", pointRadius);

  g.selectAll(".legendDots")
    .attr("r", 7);

  g.selectAll(".legendText")
    .attr("font-size", "18px")

  const clickedGroup = d3.select(this.parentNode);

  const clickedPath = clickedGroup.selectAll("path");
  clickedPath
    .transition()
    .duration(400)
    .attr("fill", lighterColor(clickedPath.attr("stroke")))
    .attr("stroke-opacity", 1)
    .attr("opacity", 1)
    .attr("stroke-width", idleWidth + 2);

  clickedGroup.selectAll(".pathDots")
    .transition()
    .duration(400)
    .attr("r", pointRadius + 4);

  clickedGroup.selectAll(".legendDots")
    .transition()
    .duration(400)
    .attr("r", 7 + 2);

  clickedGroup.selectAll(".legendText")
    .transition()
    .duration(400)
    .attr("font-size", "20px")
}

// 5: Calculate the coordinates of a point on the circumference of a circle
function angleToCoordinate(angle, value) {
  let x = Math.cos(angle) * radialScale(value);
  let y = Math.sin(angle) * radialScale(value);
  return { "x": width / 2 + x, "y": height / 2 - y };
}

let svg = d3.select("#star-plot").append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("class", "svg-style");

// scale used to map the values to the radius  
const radialScale = d3.scaleLinear()
  .domain([minStatValue, maxStatValue]) // Set the domain based on the maximum value in the data
  .range([0, 250]);

let ticks = [];
let numTicks = 6;
let increment = (maxStatValue - minStatValue) / numTicks;
for (let i = 0; i < numTicks + 1; i++) {
  ticks.push(minStatValue + i * increment);
}


svg.selectAll("circle")
  .data(ticks)
  .join(
    enter => enter.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("r", d => radialScale(d))
      .attr("stroke-opacity", 0.5)
  );

svg.selectAll(".ticklabel")
  .data(ticks)
  .join(
    enter => enter.append("text")
      .attr("class", "ticklabel")
      .attr("x", width / 2 + 5)
      .attr("y", d => height / 2 - radialScale(d) - 5)
      .text(d => d.toString())
  );


let featureData = variables.map((f, i) => {
  let angle = (Math.PI / 2) + (2 * Math.PI * i / variables.length);
  return {
    "name": f,
    "angle": angle,
    "line_coord": angleToCoordinate(angle, maxStatValue),
    "label_coord": angleToCoordinate(angle, maxStatValue + 0.5)
  };
});

// draw axis line
svg.selectAll("line")
  .data(featureData)
  .join(
    enter => enter.append("line")
      .attr("x1", width / 2)
      .attr("y1", height / 2)
      .attr("x2", d => d.line_coord.x)
      .attr("y2", d => d.line_coord.y)
      .attr("stroke", "black")
  );


// Funzione per calcolare la posizione x in base alla posizione della feature
function calculateXPosition(d, i) {
  if (i == 0)
    return d.line_coord.x - 25
  else if (i == 1)
    return d.line_coord.x - 90
  else if (i == 2)
    return d.line_coord.x - 40
  else if (i == 4)
    return d.line_coord.x + 11
  return d.line_coord.x
}

// Funzione per calcolare la posizione y in base alla posizione della feature
function calculateYPosition(d, i) {
  if (i == 0)
    return d.line_coord.y - 27
  else if (i == 1)
    return d.line_coord.y - 5
  else if (i == 2)
    return d.line_coord.y + 20
  else if (i == 3)
    return d.line_coord.y + 20
  return d.line_coord.y;
}

svg.selectAll(".axislabel")
  .data(featureData)
  .join(
    enter => enter.append("text")
      .attr("x", calculateXPosition)
      .attr("y", calculateYPosition)
      .text(d => d.name)
      .attr("id", d => d.name)
  );


let line = d3.line()
  .x(d => d.x)
  .y(d => d.y);

// scale used to map the name of the data case to a color
var colors = d3.scaleOrdinal()
  .domain(names)
  .range(d3.schemeTableau10);

svg.selectAll("myPlot")
  .data(data)
  .join(
    enter => {
      enter.append("g")
        .attr("id", function (d, i) { return "group" + (i + 1); })
        .each(function (d, i) { // Capture 'this' in a variable
          const group = d3.select(this);

          group.selectAll("path")
            .data(d => {
              let data = {};
              for (let i = 0; i < variables.length; i++) {
                data[variables[i]] = d[variables[i]];
              }
              const pathCoordinates = getPathCoordinates(data);
              pathCoordinates.push(pathCoordinates[0]);
              return [pathCoordinates];
            })
            .join(enter => enter.append("path")
              .attr("d", line)
              .attr("stroke-width", idleWidth)
              .attr("stroke", function (d) { return colors(group.attr("id")) })
              .attr("fill", "none")
              .attr("stroke-opacity", 1)
              .attr("opacity", idleOpacity)
              .attr("id", function (d, i) { return "path" + group.attr("id").substring(5); })
              .style("cursor", "pointer")
              .on("click", on_click)
            );

          group.selectAll("pathDots")
            .data(d => {
              let data = {};
              for (let i = 0; i < variables.length; i++) {
                data[variables[i]] = d[variables[i]];
              }
              return getPathCoordinates(data)
            })
            .join(
              enter => enter.append("circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("fill", function (d) { return colors(group.attr("id")) })
                .attr("r", pointRadius)
                .attr("class", "pathDots")
                .attr("id", function (d, i) { return "pathCircle" + group.attr("id").substring(5) }) // Unique ID based on group and index
                .style("cursor", "pointer")
                .on("click", on_click)
            );


          // legend - Dots
          group.selectAll("legendDots")
            .data([d.name])
            .enter()
            .append("circle")
            .attr("cx", 100)
            .attr("cy", () => { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .attr("class", "legendDots")
            .style("fill", function (d) { return colors(d) })
            .style("cursor", "pointer")
            .on("click", on_click)


          // legend - Labels
          group.selectAll("legendText")
            .data([d.name])
            .enter()
            .append("text")
            .attr("x", 120)
            .attr("y", function () { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function (d) { return colors(d) })
            .text(function (d) { return d })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("cursor", "pointer")
            .attr("class", "legendText")
            .on("click", on_click)

        });
    }
  );

