(function () {
	var CONFIG = {
		names_dir: "data/names/", // Where to find the data
		first_year: 1880, // First year of data available
		last_year: 2011, // Last year of data available
		max_names: 1000, // Number of names available per gender, per year
		cutoffs: [ 10, 50, 100, 500, 1000 ], // For settings
		possible_tlds: [ ".com", ".net" ], // For settings (not currently in use)
		favicon_timeout: 1e3, // How long to wait on a pending favicon request.
		weights: {
			// Pick more popular names more often.
			e: function () {
				return Math.pow(Math.random(), Math.E);
			}
		}
	};

	var DEFAULTS = {
		year: 1986,
		cutoff: 1000,
		tlds: [ ".com" ],
		weight: "e"
	};

	var ELEMENTS = {
		$body: $(document.body),
		$f: $("iframe#f"),
		$top: $("#top"),
		$domain: $("#domain"),
		$refresh: $("#refresh"),
		$settings_toggle: $("#settings_toggle"),
		$settings: $("#settings"),
		$cutoff_setting: $("#cutoff_setting"),
		$year_setting: $("#year_setting")
	};

	var Domain = function (first, second, tld) {
		this.first = first;
		this.second = second;
		this.tld = tld;
		this.domain = (first + "and" + second + tld).toLowerCase();
		this.url = "http://" + this.domain;
		this.html = "<span class='name first'>" + first + "</span><span class='and'>and</span><span class='name second'>" + second + "</span><span class='tld'>" + tld + "</span>";
		this.mid_test = false;
	};

	Domain.prototype = {
		// Favicon-based testing inspired by CensorSweeper, 
		// by Dan Kaminsky, Joseph Van Geffen, and Michael Tiffany: 
		// http://www.censorsweeper.com
		test: function (onStart, onSuccess, onError) {
			this.mid_test = true;
			onStart.call(this);
			var img = document.createElement("img");
			var _this = this;
			var pending = true;
			img.src = this.url + "/favicon.ico";
			img.onload = function (e) {
				pending = false;
				onSuccess.call(_this, e);
				_this.mid_test = false;
			};
			img.onerror = function (e) {
				pending = false;
				onError.call(_this, e);
				_this.mid_test = false;
			};
			window.setTimeout(function () {
				if (pending) {
					img.onload = null;
					img.onerror = null;
					onError.call(_this);
					_this.mid_test = false;
				}
			}, CONFIG.favicon_timeout);
		}	
	};

	var Names = function (opts) {
		this.opts = opts;	
	};

	Names.prototype = {
		// Grab name data.
		fetch: function (callback) {
			var url = CONFIG.names_dir + this.opts.year + ".json";
			var _this = this;
			$.getJSON(url, function (names) {
				_this.names = names;
				_this.top_names = names.slice(0, _this.opts.cutoff || DEFAULTS.cutoff);
				callback.call(_this);
			});
		},
		// Return a random name. `gender`: 0 for male, 1 for female.
		sample: function (gender) {
			var weight = CONFIG.weights[this.opts.weight] || Math.random;
			return this.top_names[Math.floor(weight() * this.top_names.length)][gender];
		},
		// Get random pair of names.
		pair: function () {
			var first_gender = Number(Math.random() < 0.5);
			var second_gender = first_gender ^ Number(!this.opts.same_sex); // Bitwise XOR
			return [ this.sample(first_gender), this.sample(second_gender) ];
		},
		// Based on name pair, generate a domain to test.
		generateDomain: function () {
			var pair = this.pair();
			var tld = this.opts.tlds[Math.floor(Math.random() * this.opts.tlds.length)];
			return new Domain(pair[0], pair[1], tld);	
		},
		// Keep generating names/domains until Domain.test succeeds.
		generateUntilSuccessful: function (onStart, onSuccess) {
			var _this = this;
			this.domain = this.generateDomain();
			this.domain.test(onStart, onSuccess, function (e) {
				_this.generateUntilSuccessful(onStart, onSuccess);
			});
		}
	};

	// Called every time a domain is tested.
	var onStart = function (e) {
		ELEMENTS.$f.attr({ "src": "" });
		ELEMENTS.$top.addClass("max");
		ELEMENTS.$domain.removeClass("success");
		ELEMENTS.$domain.addClass("error");
		ELEMENTS.$domain.html(this.html);
	}; 

	// Called when a domain passes Domain.test.
	var onSuccess = function (e) {
		ELEMENTS.$f.attr({ src: this.url });
		ELEMENTS.$domain.removeClass("error");
		ELEMENTS.$domain.addClass("success");
		window.setTimeout(function () {
			ELEMENTS.$top.removeClass("max");
			ELEMENTS.$f.show();
		}, 0.5 * 1e3);
	};

	// Construct settings section.
	// Might want to move this to a separate script.
	var buildSettings = function (names) {
		var years = [];
		for (var i = CONFIG.last_year; i > CONFIG.first_year - 1; i--) {
			years.push(i);
		}

		var updateLocalStorage = function () {
			if (window.localStorage && window.JSON) {
				localStorage.setItem("custom_settings", JSON.stringify(names.opts));
				localStorage.setItem("settings_timestamp", Math.floor(new Date().getTime() / 1000));
			}
		};

		// Add cutoff options.
		ELEMENTS.$cutoff_setting.html($.map(CONFIG.cutoffs, function (cutoff, i) {
			return $("<option value='" + cutoff + "'" + (cutoff === names.opts.cutoff ? "selected" : "") + ">" + cutoff + "</option>");
		}));

		// Add year options.
		ELEMENTS.$year_setting.html($.map(years, function (year, i) {
			return $("<option value='" + year + "'" + (year === names.opts.year ? "selected" : "") + ">" + year + "</option>");
		}));

		// Listen for cutoff changes.
		ELEMENTS.$cutoff_setting.change(function (e) {
			var cutoff = parseInt($(this).val(), 10);
			names.opts.cutoff = cutoff;
			names.top_names = names.names.slice(0, cutoff);
			updateLocalStorage();
		});

		// Listen for year changes.
		ELEMENTS.$year_setting.change(function (e) {
			var year = parseInt($(this).val(), 10);
			names.opts.year = year;
			names.fetch(function () {});
			updateLocalStorage();
		});

		// Listen for settings-toggle clicks.
		ELEMENTS.$settings_toggle.click(function () {
			ELEMENTS.$body.toggleClass("settings");
		});
	};

	// Load settings from localStorage if stashed there.
	var custom_settings = (window.JSON && window.localStorage && localStorage.getItem("custom_settings")) ? JSON.parse(localStorage.getItem("custom_settings")) : null;

	// Construct our main object.
	var names = new Names(custom_settings || DEFAULTS);

	// Called on page-load and each internal refresh.
	var go = function () {
		if (names.domain && names.domain.mid_test) { return; }
		ELEMENTS.$body.removeClass("settings");
		names.generateUntilSuccessful(onStart, onSuccess);
	};

	names.fetch(go);
	ELEMENTS.$refresh.click(go);
	window.addEventListener('shake', go, false);
	buildSettings(names);

}).call(this);
