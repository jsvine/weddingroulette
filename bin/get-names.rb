require "nokogiri"
require "trollop"
require "net/http"
require "uri"
require "json"

DEST_DIR = File.join(File.dirname(__FILE__), "..", "site/data/names")
SSA_CGI = "http://www.ssa.gov/cgi-bin/popularnames.cgi"

opts = Trollop::options do
	opt :years, "Years to get. Any year(s) 1880 or later. Defaults to 1986.", :type => :integers, :default => [ 1986 ]
	opt :limit, "Names to fetch per year. 20, 50, 100, 500, or 1000. Defaults to 1000.", :type => :integer, :default => 1000 
end

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

opts.years.each do |year|
	STDERR.write ">> #{year}\n"
	page = NamePage.new year, opts.limit
	names = page.fetch.get_names	
	dest = File.join(DEST_DIR, "#{year}.json")
	File.open dest, "w" do |f|
		f.write JSON.dump(names)
	end
end
