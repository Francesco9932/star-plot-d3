import data from '../data.json' assert { type: 'json' };


let width = 1200;
let height = 650;
let idleOpacity = 0.5;
let idleWidth = 4;
let pointRadius = 5;

let names = data.map(d => d.name); // like ["Thor", "IronMan", "Hulk", ...]
// removing the name from the object
data.forEach(function (d) {
  delete d.name;
});
let variables = Object.keys(data[0]);  // like ["strength", "intelligence", "speed", ...]

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
function on_click(_, i) {
  svg.selectAll("path")
    .attr("fill", "none")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", idleWidth)
    .attr("opacity", idleOpacity);

  const clickedPath = d3.select(this);

  d3.select(this)
    .transition()
    .duration(400)
    .attr("fill", lighterColor(clickedPath.attr("stroke")))
    .attr("stroke-opacity", 1)
    .attr("opacity", 1)
    .attr("stroke-width", idleWidth + 2);
}

// 5: Calculate the coordinates of a point on the circumference of a circle
function angleToCoordinate(angle, value) {
  let x = Math.cos(angle) * radialScale(value);
  let y = Math.sin(angle) * radialScale(value);
  return { "x": width / 2 + x, "y": height / 2 - y };
}

let svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "svg-style");

// scale used to map the values to the radius  
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
      .attr("stroke-width", idleWidth)
      .attr("stroke", function (d) { return colors(d) })
      .attr("fill", "none")
      .attr("stroke-opacity", 1)
      .attr("opacity", idleOpacity)
      .on("click", on_click)
  );

// create a dot for each data point in the path
svg.selectAll("myCircles")
  .data(data)
  .join(
    enter => enter.append("g")
      .attr("class", "circle-group")
      .attr("fill", function (d) { return colors(d) })
      .selectAll("circle")
      .data(d => getPathCoordinates(d))
      .join(
        enter => enter.append("circle")
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .attr("r", pointRadius)
      )
  );

// legend - Dots
svg.selectAll(".mydots")
  .data(names)
  .enter()
  .append("circle")
  .attr("cx", 100)
  .attr("cy", function (d, i) { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
  .attr("r", 7)
  .style("fill", function (d) { return colors(d) })
//.attr("id", function (d) { return d });


// legend - Labels
svg.selectAll("mylabels")
  .data(names)
  .enter()
  .append("text")
  .attr("x", 120)
  .attr("y", function (d, i) { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
  .style("fill", function (d) { return colors(d) })
  .text(function (d) { return d })
  .attr("text-anchor", "left")
  .style("alignment-baseline", "middle")
