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

// Create Zone for Sum Days per continent
var SumDaysSelector = d3.select("div", "#tabSumYears");



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
  	
  	console.log('nestWomen:',nestWomen);
  	
  	//Nesting an rollup to know total days for one continent
  	var nestWomenSumContinent = d3.nest()
  		.key(function(d){ 
  			return d.continent; 
  		})
  		.rollup(function(w){ 
  			return d3.sum(w, function(d) {return (d.mandateDuration)}); 
  		})
  		.entries(womendata)
    
    console.log('nestWomenSumContinent:',nestWomenSumContinent);
    
    //Double Nesting to know list of countries for each continent
    var nestContCountry = d3.nest()
    	.key(function(d){ 
  			return d.continent; 
  		})
  		.key(function(d){ 
  			return d.country; 
  		})
  		.entries(womendata)
  		
  	console.log('nestContCountry:',nestContCountry); 

  	var countCountryByContinent = [] ;
  	
  	// Compute # of countries for each continent
  	nestContCountry.forEach( (e) => {
  		countCountryByContinent.push({'continent':e.key,'countCountry':e.values.length});
  	});
  	
  	console.log('countCountryByContinent:',countCountryByContinent);  		
    
    // ADDING A SUM SECTION BY CONTINENT

	var offset = marginSide * 2;
	
	nestWomenSumContinent.forEach( (o) => {
    	SumDaysSelector.append("text").text(o.key)
    		.attr('class','sumContinent')
    		.style('font-size', fontSizeContinent(o.value) + "px")
    		.style('color', color(o.key))
			// On utilise style pour définir l'endroit d'affichage
			.style("left", spaceContinentSum(countCountryByContinent, o.key, width, offset) + "px");
			//.style("top", (d3.event.pageY) + "px");
    });
    
    // Creating scales //
    var minStartDate = d3.min(womendata, function(d) { return d.mandateStart ; }); 
	var maxEndDate = d3.max(womendata, function(d) { return d.mandateEnd ; });
    var daysTotal = d3.timeDay.count(minStartDate,maxEndDate);
    console.log("daysTotal:",daysTotal);


	var yScale = d3.scaleTime()
		.range([height,0]);
	
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
	.attr("rx", 3)
	.attr("ry", 3)
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
	
	// later to include link '<a href= "http://google.com">' + formatTime(d.date) + 	"</a>" 
	return '<b>Name:</b>' + women.name 
			+ '<br/> <b> Country: </b>' + women.country
			+ '<br/> <b> Mandate: </b>' + timeFormat(women.mandateStart) + '-' + timeFormat(women.mandateEnd);
	
}

function printYearsDays(o) {
	var years = Math.trunc(o.value / 365);
	var days = o.value - years*365
	 
	return `${years} years 
	and ${days} days. `
}

function fontSizeContinent(sumDays){
	var years = Math.trunc(sumDays / 365);
	var fontSize;
	if (years < 50){
		fontSize = 11;
	}
	else if (years >= 50 && years < 100){
		fontSize = 14;
	}
	else if (years >= 100 && years < 200){
		fontSize = 20;
	}
	else if (years >= 200){
		fontSize = 26;
	}
	return fontSize;
}

//countCountryByContinent.push({'continent':e.key,'countCountry':e.values.length});
function spaceContinentSum(countCountryByContinent, continent, width, offset){

	var sumCountry = 0;
	
	countCountryByContinent.forEach( (e) => {
		sumCountry += e.countCountry;
	});
	//console.log(sumCountry);
	
	var space = (width - 2*marginSide) / sumCountry ;
	// MAIS NOOONNN CA PREND PAS EN COMPTE EUX QUI SE SUPPERPOOOOSE ET OUIII
	
	
	var countCountry = 0;
	
	for(var i = 0; i < countCountryByContinent.length; i++){
	
		if (continent == countCountryByContinent[i].continent){
			break;
		}
		else {
			countCountry += countCountryByContinent[i].countCountry;
		}
	}
	//console.log(countCountry);	
	return space * countCountry + offset ;

}









