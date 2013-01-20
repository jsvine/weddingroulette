(function () {
	var CONFIG = {
		first_year: 1880,
		last_year: 2011,
		names_dir: "data/names/"
	};

	var ELEMENTS = {
		$f: $("iframe#f"),
		$top: $("#top"),
		$refresh: $("#refresh"),
		$domain: $("#domain")
	};

	var sample = function (arr, fn) {
		fn = fn || Math.random;
		return arr[Math.floor(fn() * arr.length)];
	};

	var powerWeight = function () {
		return Math.pow(Math.random(), Math.E);
	};
	
	var fetchNames = function (year, callback) {
		var url = CONFIG.names_dir + year + ".json";
		$.getJSON(url, callback);
	};

	var testFavicon = function (domain, success, error) {
		var $img = $("<img>");
		$img.attr({ 
			src: "http://" + domain + "/favicon.ico",
		});
		var pending = true;
		$img.load(function (e) {
			pending = false;
			success.apply(this, [ e, domain ]);
		});
		$img.error(function (e) {
			pending = false;
			error.apply(this, [e, domain ]);
		});
		setTimeout(function () {
			if (pending) { $img.error(); }
		}, 1 * 1e3);
	};

	var onSuccess = function (e, domain) {
		ELEMENTS.$f.attr({ src: "http://" + domain });
		ELEMENTS.$domain.removeClass("error");
		ELEMENTS.$domain.addClass("success");
		ELEMENTS.$f[0].onload = function() { 
			ELEMENTS.$top.removeClass("max");
			ELEMENTS.$f.show();
			ELEMENTS.$refresh.show();
		};
	};

	var onError = function (e, domain) {
		generateDomain();
	};

	var generateDomain = function () {
		fetchNames(1986, function (data) { 
			var domain = sample(data, powerWeight)[0] + "and" + sample(data, powerWeight)[1] + ".com";
			ELEMENTS.$f.hide();
			ELEMENTS.$refresh.hide();
			ELEMENTS.$top.addClass("max");
			ELEMENTS.$domain.removeClass("success");
			ELEMENTS.$domain.addClass("error");
			ELEMENTS.$domain.html(domain);
			testFavicon(domain, onSuccess, onError);
		});
	};
	ELEMENTS.$refresh.click(generateDomain);
	generateDomain();
}).call(this);
