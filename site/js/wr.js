(function () {
	var CONFIG = {
		first_year: 1880,
		last_year: 2011,
		max_names: 1000,
		cutoffs: [ 10, 50, 100, 500, 1000 ],
		possible_tlds: [ ".com", ".net" ],
		names_dir: "data/names/",
		favicon_timeout: 1e3,
		weights: {
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
	};

	Domain.prototype = {
		test: function (onStart, onSuccess, onError) {
			onStart.call(this);
			var img = document.createElement("img");
			var _this = this;
			var pending = true;
			img.src = this.url + "/favicon.ico"
			img.onload = function (e) {
				pending = false;
				delete img;
				onSuccess.call(_this, e);
			};
			img.onerror = function (e) {
				pending = false;
				delete img;
				onError.call(_this, e);
			};
			window.setTimeout(function () {
				if (pending) {
					console.log("timeout");
					img.onload = null;
					img.onerror = null;
					delete img;
					onError.call(_this);
				}
			}, CONFIG.favicon_timeout);
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
				_this.top_names = names.slice(0, _this.opts.cutoff || DEFAULTS.cutoff);
				callback.call(_this);
			});
		},
		// Return a random name. `gender`: 0 for male, 1 for female.
		sample: function (gender) {
			var weight = CONFIG.weights[this.opts.weight] || Math.random;
			return this.top_names[Math.floor(weight() * this.top_names.length)][gender];
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
		ELEMENTS.$top.addClass("max");
		ELEMENTS.$domain.removeClass("success");
		ELEMENTS.$domain.addClass("error");
		ELEMENTS.$domain.html(this.html);
	}; 

	var onSuccess = function (e) {
		ELEMENTS.$f.attr({ src: this.url });
		ELEMENTS.$domain.removeClass("error");
		ELEMENTS.$domain.addClass("success");
		window.setTimeout(function () {
			ELEMENTS.$top.removeClass("max");
			ELEMENTS.$f.show();
		}, 0.5 * 1e3);
	};

	var buildSettings = function (names) {
		var years = [];
		for (var i = CONFIG.last_year; i > CONFIG.first_year - 1; i--) {
			years.push(i);
		}

		var updateLocalStorage = function () {
			if (window.localStorage) {
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
			var cutoff = parseInt($(this).val());
			names.opts.cutoff = cutoff;
			names.top_names = names.names.slice(0, cutoff);
			updateLocalStorage();
		});

		// Listen for year changes.
		ELEMENTS.$year_setting.change(function (e) {
			var year = parseInt($(this).val());
			names.opts.year = year;
			names.fetch(function () {});
			updateLocalStorage();
		});

		// Listen for settings-toggle clicks.
		ELEMENTS.$settings_toggle.click(function () {
			ELEMENTS.$body.toggleClass("settings");
		});
	};

	var custom_settings = window.localStorage ? JSON.parse(localStorage.getItem("custom_settings")) : null;
	var names = new Names(custom_settings || DEFAULTS);

	var go = function () {
		ELEMENTS.$body.removeClass("settings");
		names.generateUntilSuccessful(onStart, onSuccess);
	};

	names.fetch(go);
	ELEMENTS.$refresh.click(go);
	window.addEventListener('shake', go, false);
	buildSettings(names);

}).call(this);
