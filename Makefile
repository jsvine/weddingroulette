.PHONY = default names

default:
	@echo "No default rule."

names:
	ruby bin/get-names.rb --years {1880..2011}
