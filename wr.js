var prevent_bust = false;
var refresh_counter = 0; 
window.onbeforeunload = function() {
	_gaq.push(['_trackEvent', 'Metrics', 'url_on_leaving', current.url[1]]);
	if(prevent_bust){
		setTimeout(function(){window.top.location = 'http://www.weddingroulette.com/';}, 1);
	}
	else{
		_gaq.push(['_trackEvent', 'Metrics', 'spins_before_leaving', refresh_counter]);
	}
};

var names = get_names();
var settings = {
	rand_mode: "pow",
	cutoff: 100,
	orientation: "opposite",
	endings: ["com", "net"]
};
var current = {
	url: "",
	pair: [],
	flipped: false
};

function rand_rank(){
	switch(settings.rand_mode){
		case "raw":
			return Math.floor(Math.random()*settings.cutoff);
		case "pow":
			return Math.floor(Math.pow(Math.random(), 3)*settings.cutoff);
	}
}
function make_pair(){
	var first = (Math.random() < 0.5) ? "m" : "f", 
		second = "";
	if(settings.orientation === "opposite"){
		second = (first === "m") ? "f" : "m";
	}
	else{
		second = first;
	}
	return [names[first][rand_rank()].toLowerCase(), names[second][rand_rank()].toLowerCase()];
}
function refresh(){
	current.pair = make_pair();
	current.flipped = false;
}
function make_url(pair){
	var e = settings.endings[Math.floor(Math.random()*settings.endings.length)];
	return [pair.join("<span class='quiet'>and</span>") + "<span class='quiet'>." + e + "</span>", "http://www." + pair.join("and").toLowerCase() + "." + e];
}
function load_frame(){
	current.url = make_url(current.pair);
	$("#url").hide();
	$("#url").html(current.url[0]);
	$("#url").fadeIn("fast");
	$("#f").attr("src", "loading.html");
	$.ajax({
      url: "http://domai.nr/api/json/info?q="+current.url[1].slice(11)+"&callback=?",
      async: false,
      dataType: 'json',
      success: function (json) {
          if(json.availability === "taken"){
			prevent_bust = true;
			setTimeout(function(){
				$("#f").attr("src", current.url[1]).ready(function(){
					setTimeout(function(){
						prevent_bust = false;
					}, 1000);
				});
			}, 100);
          }
		else{
			if(current.flipped){
				$("#f").attr("src", "notfound.html");
			}
			else{
				refresh(); load_frame();
			}
		}
      }
    });
    
}

function flip(){
	if(!current.pair[0]){return false;}
	current.pair = [current.pair[1], current.pair[0]];
	current.flipped = true;
	load_frame();
	refresh_counter++;
}

$("#refresh").click(function(){
	_gaq.push(['_trackEvent', 'Buttons', 'Refresh']);
	refresh(); 
	load_frame();
	refresh_counter++;
});
$("#flip").click(function(){
	_gaq.push(['_trackEvent', 'Buttons', 'Flip']);	
	flip();
});
$("#settings_toggle").click(function(){
	_gaq.push(['_trackEvent', 'Buttons', 'Settings']);
	var s_div = $("#settings_toggle");
	if(s_div.html() === "Settings"){
		s_div.html("Hide Settings");
	}
	else{s_div.html("Settings");}
	$("#settings").toggle();
});
$("#cutoff").change(function(){
	settings.cutoff = $("#cutoff :selected").val();
});
$("#rand_mode").change(function(){
	settings.rand_mode = $("#rand_mode :selected").val();
});
$("#orientation").change(function(){
	settings.orientation = $("#orientation :selected").val();
});
$("#endings").change(function(){
	var e = $("#endings :selected").val();
	switch(e){
		case "com":
			settings.endings = ["com"];
			break;
		case "net":
			settings.endings = ["net"];
			break;
		case "both":
			settings.endings = ["com", "net"];
			break;
	}
});
