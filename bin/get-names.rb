# Writes popular baby names to the site/data/names/ directory.
#
# For each year, writes an array-of-arrays JSON file:
# 	[ 
# 		[ male-name-1, female-name-1 ], 
# 		[ male-name-2, female-name-2 ], 
# 		... 
# 	]

require "nokogiri"
require "trollop"
require "net/http"
require "uri"
require "json"

# Directory where we want to write the files
DEST_DIR = File.join(File.dirname(__FILE__), "..", "site/data/names")

# The Social Security Administration's CGI form for popular baby name data
# More info: http://www.ssa.gov/oact/babynames/
SSA_CGI = "http://www.ssa.gov/cgi-bin/popularnames.cgi"

# Command-line options
opts = Trollop::options do
	opt :years, "Years to get. Any year(s) 1880 or later. Defaults to 1986.", :type => :integers, :default => [ 1986 ]
	opt :limit, "Names to fetch per year. 20, 50, 100, 500, or 1000. Defaults to 1000.", :type => :integer, :default => 1000 
end

# Main class for a year's worth of popular baby names
class NamePage
	def initialize (year, limit)
		@year = year
		@limit = limit
	end
	def fetch
		uri = URI.parse SSA_CGI
		post_data = { :year => @year, :top => @limit }
		response = Net::HTTP.post_form uri, post_data
		@dom = Nokogiri::HTML response.body
		self
	end
	def get_names
		rows = @dom.css("table")[2].css("tr")[1..1000]
		names = rows.map do |tr|
			i, male, female = tr.css("td").map(&:content)
			[ male, female ]
		end
	end
end

# Loop through each year we want to fetch/write data
opts.years.each do |year|
	STDERR.write ">> #{year}\n"
	page = NamePage.new year, opts.limit
	names = page.fetch.get_names	
	dest = File.join(DEST_DIR, "#{year}.json")
	File.open dest, "w" do |f|
		f.write JSON.dump(names)
	end
end
