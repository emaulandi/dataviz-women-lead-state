// WOMEN HEAD JAVASCRIPT


// DEFINE DRAWING AREA SIZING
var height = 500;
var width = 1300;
var marginTop = 10;
var marginBottom = 150;
var marginSide = 30;

// CREATE DRAWING PART MOVED 30,30 FROM SVG

var svg = d3.select("svg")
	.attr("width", width + 2*marginSide)
	.attr("height", height + marginSide + marginBottom)
		.append("g")
		.attr("transform", "translate(" + marginSide + "," + marginSide + ")");


/// TOOLTIP ///
// Add a div that will go wherever in the body 
var tooltip = d3.select("body").append("div")
	.attr("class", "tooltip");



// LOADING CSV
//d3.csv("test.csv", function(women) {
//d3.csv("3-1-simplecsv.csv", function(women) {
d3.csv("3-WomenHeadOfStateClean.csv", function(women) {

	//console.log("input data:", women);
	var timeFormat = d3.timeFormat("%d/%m/%Y");
	var timeParser = d3.timeParse("%d/%m/%Y");
	
	womendata = women.map(function(d) {
        var mandateStart = timeParser(d.mandateStart);
        //console.log(mandateStart);
        var mandateEnd ;
        if (d.mandateEnd == 'Incumbent'){
        	mandateEnd = new Date();
        }
        else {
        	mandateEnd = timeParser(d.mandateEnd);
        }
        
        return {
        	"name": d.name, 
        	"country": d.dataCountry,
        	"continent": d.continent,
        	"office": d.office,
        	"mandateStart": mandateStart,
        	"mandateEnd": mandateEnd,
        	"mandateDuration": d3.timeDay.count(mandateStart,mandateEnd)
        } ;
    });
    
    console.log("output data:",womendata);
    
    // Nesting to group data by continent
    var nestWomen = d3.nest()
  		.key(function(d){
    		return d.continent;
  		})
  		.entries(womendata)
  	
  	console.log(nestWomen);
  	
  	//Nesting an rollup to know total days for one continent
  	var nestWomenSum = d3.nest()
  		.key(function(d){ 
  			return d.continent; 
  		})
  		.rollup(function(w){ 
  			return d3.sum(w, function(d) {return (d.mandateDuration)}); 
  		})
  		.entries(womendata)
    
    console.log(nestWomenSum);
    
    var minStartDate = d3.min(womendata, function(d) { return d.mandateStart ; }); 
	var maxEndDate = d3.max(womendata, function(d) { return d.mandateEnd ; });
    var daysTotal = d3.timeDay.count(minStartDate,maxEndDate);
    console.log("daysTotal:",daysTotal);
    
	// Creating scales //

	var yScale = d3.scaleTime()
		//.domain([new Date(2010,1,1), new Date(2017,1,1)])
		.range([height,0]);

	//ça ne fait rien
	//yScale.tickFormat(d3.timeFormat("%%d/%m/%Y"));
	
	//USING ID AS X SCALE
	/*
	var xScale = d3.scaleLinear()
	.domain([0, 10])
	.range([0, width]);

	var xAxis = d3.axisBottom(xScale);
	svg.append("g")
		.attr("transform", "translate(" + 0 + "," + height + ")")
		.call(xAxis);
	*/
	
	//USING COUNTRY NAME AS X SCALE
	var xScale = d3.scaleBand().rangeRound([0, width]);
	xScale.domain(womendata.map(function(d) { return d.country; }));
	
	var xAxis = d3.axisBottom(xScale);
	var xAxisSelector = svg.append("g")
		.attr("transform", "translate(" + 0 + "," + height + ")")
		.call(xAxis)
			.selectAll("text")  
			.style("text-anchor", "end")
			.style("font-size", "9px")
			.attr("dx", "-10px")
			.attr("dy", "-6px")
			.attr("transform", "rotate(-90)");
	
	// AVANT DE BINDER LES DATA !!! SINON LE SCALE EST FAUX 
	// Pourquoi ??
	yScale.domain([minStartDate,maxEndDate]);
		
	//CALL HERE THE DRAWING FUNCTION
    // WOMENDATA IS NOT DEFINED OUTSIDE
    // Bind data
    var selection = svg.selectAll("rect")
	.data(womendata)
	.enter()
	.append("rect")
	// PAS BESOIN de faire une fonction RATIO, on peut appliquer direct les scales!
	.attr("x", 
		(d,i) => {return xScale(d.country);})
	.attr("y", 
		(d,i) => {return yScale(d.mandateEnd);})
	.attr("width", 5)
	//.attr("height",30)
	.attr("height",
		(d,i) => {
			return rectHeight(d.mandateDuration,daysTotal,height);
		}
	)
	.style("fill", (d,i) => {return color(d.continent);})
	.on("mouseover", function(d) {
		
  		tooltip.transition()
       		.duration(500)
       		.style("opacity", .9);

       	// $(selector).html(content) >> ici on utilise pas $ > car sélecteur d3 : on a déjà fait var tooltip = d3.select("body").append("div") ...
		tooltip.html(print(d))
			// On utilise style pour définir l'endroit d'affichage
		   .style("left", (d3.event.pageX) + "px")
		   .style("top", (d3.event.pageY) + "px");
		   /* => Comment faire pour référencer le centre du rond : eg les attributs cx et cy de l'élément circle
		   .style("left", (this.attr("cx") + "px"))
		   .style("top", (this.attr("cy") + "px")); 
		   */  
	  })
	  .on("mouseout", function(d) {
		  tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
	  });
		
	// CALL Y AXIS
	svg.append("g").call(d3.axisRight(yScale));

    
});

function rectHeight(mandateDuration,totalDays, height){
	return (mandateDuration * height) / totalDays ;
}

function color(continent){
	var color;
	if (continent == "Asia") {color = 'YellowGreen'}
	else if (continent == "South America") {color = 'Peru'}
	else if (continent == "North America") {color = 'Chocolate'}
	else if (continent == "Africa") {color = 'Gold'}
	else if (continent == "Europe") {color = 'DeepSkyBlue'}
	else if (continent == "Oceania") {color = 'Tomato'}
	return color;
	
}

function print(women) {
	// trouver comment on fait la break ligne
	var timeFormat = d3.timeFormat("%d/%m/%Y");
	
	return `name:${women.name},
	country:${women.country}, 
	mandate start :${timeFormat(women.mandateStart)}, 
	mandate end:${timeFormat(women.mandateEnd)}`;
}





