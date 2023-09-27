// read from json
import data from '../data.json' assert { type: 'json' };


let variables = data.map(d => d.name); // like ["Thor", "IronMan", "Hulk", ...]
// removing the name from the object
data.forEach(function (oggetto) {
  delete oggetto.name;
});
let features = Object.keys(data[0]);  // like ["strength", "intelligence", "speed", ...]


let idleOpacity = 0.5;
let width = 1000;
let height = 700;
let svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "svg-style");

// Calculate the domain for the radialScale based on the data
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


function getPathCoordinates(data_point) {
  let coordinates = [];
  for (var i = 0; i < features.length; i++) {
    let ft_name = features[i];
    let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
    coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
  }
  return coordinates;
}

function lightenColor(color) {
  const c = d3.color(color);
  c.opacity = 0.6;
  return c.toString();
}


function on_click(_, i) {
  svg.selectAll("path")
    .attr("fill", "none")
    .attr("stroke-opacity", 1)
    .attr("opacity", idleOpacity);

  const clickedPath = d3.select(this);

  d3.select(this)
    .transition()
    .duration(300)
    .attr("fill", lightenColor(clickedPath.attr("stroke")))
    .attr("stroke-opacity", 1)
    .attr("opacity", 1)
    .attr("stroke-width", 5);
}


const radialScale = d3.scaleLinear()
  .domain([minStatValue, maxStatValue]) // Set the domain based on the maximum value in the data
  .range([0, 280]);

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


function angleToCoordinate(angle, value) {
  let x = Math.cos(angle) * radialScale(value);
  let y = Math.sin(angle) * radialScale(value);
  return { "x": width / 2 + x, "y": height / 2 - y };
}


let featureData = features.map((f, i) => {
  let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
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


// draw axis label
svg.selectAll(".axislabel")
  .data(featureData)
  .join(
    enter => enter.append("text")
      .attr("x", d => d.label_coord.x - 15)
      .attr("y", d => d.label_coord.y - 15)
      .text(d => d.name)
  );

let line = d3.line()
  .x(d => d.x)
  .y(d => d.y);

// usually you have a color scale in your chart already
var colors = d3.scaleOrdinal()
  .domain(variables)
  .range(d3.schemeTableau10);

// Create the paths
svg.selectAll("path")
  .data(data)
  .join(
    enter => enter.append("path")
      .datum(d => {
        const pathCoordinates = getPathCoordinates(d);
        // Aggiungi il punto finale uguale al punto iniziale
        pathCoordinates.push(pathCoordinates[0]);
        return pathCoordinates;
      })
      .attr("d", line)
      .attr("stroke-width", 4)
      .attr("stroke", function (d) { return colors(d) })
      .attr("fill", "none")
      .attr("stroke-opacity", 1)
      .attr("opacity", idleOpacity)
      .on("click", on_click)
  );


// legend - Dots
svg.selectAll("mydots")
  .data(variables)
  .enter()
  .append("circle")
  .attr("cx", 100)
  .attr("cy", function (d, i) { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
  .attr("r", 7)
  .style("fill", function (d) { return colors(d) })


// legend - Labels
svg.selectAll("mylabels")
  .data(variables)
  .enter()
  .append("text")
  .attr("x", 120)
  .attr("y", function (d, i) { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
  .style("fill", function (d) { return colors(d) })
  .text(function (d) { return d })
  .attr("text-anchor", "left")
  .style("alignment-baseline", "middle")
