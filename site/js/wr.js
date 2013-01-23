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
		$img.load(function (e) {
			success.apply(this, [ e, domain ]);
		});
		$img.error(function (e) {
			error.apply(this, [e, domain ]);
		});
	};

	var onSuccess = function (e, domain) {
		ELEMENTS.$f.attr({ src: "http://" + domain });
		ELEMENTS.$domain.removeClass("error");
		ELEMENTS.$domain.addClass("success");
		window.setTimeout(function () {
			ELEMENTS.$top.removeClass("max");
			ELEMENTS.$f.show();
			ELEMENTS.$refresh.show();
		}, 0.5 * 1e3);
	};

	var onError = function (e, domain) {
		generateDomain();
	};

	var Domain = function (first, second, tld) {
		this.first = first;
		this.second = second;
		this.tld = tld;
		this.domain = first + "and" + second + tld;
		this.url = "http://" + this.domain;
		this.html = "<span class='name first'>" + first + "</span><span class='and'>and</span><span class='name second'>" + second + "</span><span class='tld'>" + tld + "</span>";
	};

	Domain.prototype = {
		test: function () {
			testFavicon(this.domain, onSuccess, onError);
		}	
	};

	var generateDomain = function () {
		fetchNames(1986, function (data) { 
			var domain = new Domain(sample(data, powerWeight)[0], sample(data, powerWeight)[1], ".com");
			ELEMENTS.$f.attr({ "src": "" });
			ELEMENTS.$refresh.hide();
			ELEMENTS.$top.addClass("max");
			ELEMENTS.$domain.removeClass("success");
			ELEMENTS.$domain.addClass("error");
			ELEMENTS.$domain.html(domain.html);
			domain.test();
		});
	};
	ELEMENTS.$refresh.click(generateDomain);
	generateDomain();
}).call(this);
