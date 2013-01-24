(function () {
	var CONFIG = {
		first_year: 1880,
		last_year: 2011,
		names_dir: "data/names/"
	};

	var DEFAULTS = {
		year: 1986,
		tlds: [ ".com" ],
		weight: function () {
			return Math.pow(Math.random(), Math.E);
		}
	};

	var ELEMENTS = {
		$f: $("iframe#f"),
		$top: $("#top"),
		$refresh: $("#refresh"),
		$domain: $("#domain")
	};

	var Domain = function (first, second, tld) {
		this.first = first;
		this.second = second;
		this.tld = tld;
		this.domain = (first + "and" + second + tld).toLowerCase();
		this.url = "http://" + this.domain;
		this.html = "<span class='name first'>" + first + "</span><span class='and'>and</span><span class='name second'>" + second + "</span><span class='tld'>" + tld + "</span>";
	};

	Domain.prototype = {
		test: function (onStart, onSuccess, onError) {
			onStart.call(this);
			var $img = $("<img>");
			var _this = this;
			$img.attr({ 
				src: this.url + "/favicon.ico",
			});
			$img.load(function (e) {
				onSuccess.call(_this, e);
			});
			$img.error(function (e) {
				onError.call(_this, e);
			});
		}	
	};

	var Names = function (opts) {
		this.opts = opts;	
	};

	Names.prototype = {
		fetch: function (callback) {
			var url = CONFIG.names_dir + this.opts.year + ".json";
			var _this = this;
			$.getJSON(url, function (names) {
				_this.names = names;
				callback.call(_this);
			});
		},
		// Return a random name. `gender`: 0 for male, 1 for female.
		sample: function (gender) {
			var weight = this.opts.weight || Math.random;
			return this.names[Math.floor(weight() * this.names.length)][gender];
		},
		pair: function () {
			var first_gender = Number(Math.random() < 0.5);
			var second_gender = first_gender ^ Number(!this.opts.same_sex); // Bitwise XOR
			return [ this.sample(first_gender), this.sample(second_gender) ];
		},
		generateDomain: function () {
			var pair = this.pair();
			var tld = this.opts.tlds[Math.floor(Math.random() * this.opts.tlds.length)];
			return new Domain(pair[0], pair[1], tld);	
		},
		generateUntilSuccessful: function (onStart, onSuccess) {
			var _this = this;
			var domain = this.generateDomain();
			domain.test(onStart, onSuccess, function (e) {
				_this.generateUntilSuccessful(onStart, onSuccess);
			});
		}
	};

	var onStart = function (e) {
		ELEMENTS.$f.attr({ "src": "" });
		ELEMENTS.$refresh.hide();
		ELEMENTS.$top.addClass("max");
		ELEMENTS.$domain.removeClass("success");
		ELEMENTS.$domain.addClass("error");
		ELEMENTS.$domain.html(this.html);
		console.log(this.url);
	}; 

	var onSuccess = function (e) {
		ELEMENTS.$f.attr({ src: this.url });
		ELEMENTS.$domain.removeClass("error");
		ELEMENTS.$domain.addClass("success");
		window.setTimeout(function () {
			ELEMENTS.$top.removeClass("max");
			ELEMENTS.$f.show();
			ELEMENTS.$refresh.show();
		}, 0.5 * 1e3);
	};

	var names = new Names(DEFAULTS);

	names.fetch(function () {
		this.generateUntilSuccessful(onStart, onSuccess);
	});

	ELEMENTS.$refresh.click(function () {
		names.generateUntilSuccessful(onStart, onSuccess);
	});

}).call(this);
