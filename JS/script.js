var potHoles = {};

potHoles.record = []; //global array for first set of data to work with
potHoles.nearby = []; //global array for the radius results 
potHoles.access = "pk.eyJ1IjoiY2FyeXMiLCJhIjoiY2lmcnA0bDAxMG1yNHMybTB4cDFkMnEzMyJ9.4Z26iDuKWwLy8qs1MyTkDg";
potHoles.radius = 500;  

var myIcon = L.icon({
	iconUrl: "http://www.clker.com/cliparts/1/c/2/a/11970890841431512955Milkman666_Cone.svg.svg.thumb.png",
	iconSize: [11, 11]
});

//*Get 311 data 
potHoles.getData = function() {
	$.ajax({ 
		url: "https://json2jsonp.com/?url=https://secure.toronto.ca/webwizard/ws/requests.json?jurisdiction_id=toronto.ca",
		type: "GET",
		dataType: "jsonp",
	}).then(function(res) {
		var potHoleLocations = res.service_requests; //specifically look at the service_requests
		$.each(potHoleLocations, function(i, value) { //loop and get only non-closed ones (open and null)
			if (value.status !== "closed" && value.service_code === "CSROWR-12") {
				potHoles.record.push(value); //create the array of values, available globally once loaded
			}
		});
		$("div.showOnLoad").addClass("show"); //show top search etc on load
   		$("#counting").text(potHoles.record.length); //add number in the array once loaded
   		potHoles.plotMap(); //plot the data once loaded
	});
};

//*display all pothole data on mapbox map at bottom of page
potHoles.getMap = function() {
	L.mapbox.accessToken = potHoles.access;
	potHoles.map = L.mapbox.map('map', 'carys.nn6p55nf')
	    .setView([43.677, -79.436], 12);
	    potHoles.geocode = L.mapbox.geocoder('mapbox.places');
};

//put the data on the original map once the map is ready, including tooltips
potHoles.plotMap = function(){
	$.each(potHoles.record, function(i, value){
		if (value.lat !== null && value.long !== null) {
			L.marker([value.lat,value.long], //use regex to get rid of some text below
				{icon: myIcon}).bindPopup("<h4>"+ value.address.replace(/,.*$/, "") +"</h4>" 
												+ "<p>" + "<span class='intro'>" + "Requested date: " + "</span>" + value.requested_datetime.replace(/T.*$/, "") + "</p>"
												+ "<p>" + "<span class='intro'>" + "Expected to be completed: " + "</span>" + value.expected_datetime.replace(/T.*$/, "") + "</p>"
												+ "<p>" + "<span class='intro'>" + "Comments: " + "</span>" + (value.description ? value.description : 'None') + "</p>"
												+ (value.media_url ? "<div class='img'><img src='" + value.media_url + "'></div>" : "")
												).addTo(potHoles.map);
		}
	});
};

//get the user's entered address
potHoles.formSubmit = function() {
	$(".search_form").on("submit", function(e) {
		e.preventDefault(); //stops page from refreshing
		var newLocation = $("#search_input").val() + ", Toronto"; //stores input as variable
		potHoles.newLocation = newLocation; //stores new variable as global variable
		$("#search_input").val(""); //takes away last input
		potHoles.geocoder(newLocation); //tell the geocode function below to run
		$('html, body').animate({ 
		   scrollTop: $("#footer").offset().top}, 1000); //smooth scroll to numbers that popup
		    });
	};

//convert input into lat/long to use later
potHoles.geocoder = function(location) {
	var geocode = L.mapbox.geocoder('mapbox.places');
	map =  potHoles.map;
	geocode.query(location, showMap);
	function showMap(err, data) {
	        map.setView([data.latlng[0], data.latlng[1]], 15); //set view based on new lat/long from array & zoom
    		L.marker([data.latlng[0], data.latlng[1]]).addTo(potHoles.map);
	potHoles.newLat = data.latlng[0]; //store new ones as global variables
	potHoles.newLong = data.latlng[1];
	ll = L.latLng(potHoles.newLat, potHoles.newLong) //get the potholes within a 500m radius
	potHoles.record.forEach(function(pothole) { 
		if (pothole.lat == null || pothole.long == null) { //if lat or long or null, go to the next one
			return;
		}
		potHoles.pll = L.latLng(pothole.lat, pothole.long)
		ll.distanceTo(potHoles.pll) < potHoles.radius ? potHoles.nearby.push(pothole) : null; //push the ones within the radius into the array
	});
	//what to put on page based on search
	$("#close").text(potHoles.nearby.length); //add text to bottom section
	potHoles.nearby.length = 0; //resets length to 0 after putting it on page
	$("#where").text(potHoles.newLocation); //puts user's search on page
    $("div.resultShowOne").addClass("show"); //show bottom section
	}
};

//put it all together in the init 
potHoles.init = function() {
	potHoles.getData();
	potHoles.getMap();
	potHoles.formSubmit();		
};

//run the init on page ready
$(document).ready(function(){
  potHoles.init();
});