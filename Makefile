.PHONY = default names

default:
	@echo "No default rule."

names:
	ruby bin/get-names.rb --years {1880..2011}

sync:
	s3cmd sync -P --delete-removed ./site/ s3://www.weddingroulette.com/
