# Wedding Roulette

This repository contains the code running [weddingroulette.com](http://weddingroulette.com). Feel free to fork and submit pull requests.

I published the first version of weddingroulette.com sometime around April 2009. In January 2013, I rewrote the site from scratch.

The main difference between the two versions is how they test whether a {NAME}and{NAME}.{TLD} "exists". The first version used [domai.nr's API](http://domai.nr/api). To eliminate reliance on that service, to (in theory) speed things up, and to reduce the number of false-positive domains (i.e., those that had been bought but not developed), the second version uses favicon-based testing. This method, which takes advantage of the fact that almost every website has a favicon.ico file at its root, was inspired by [CensorSweeper](http://www.censorsweeper.com/) by Dan Kaminsky, Joseph Van Geffen, and Michael Tiffany.


# TODO

- Find a decent solution for preventing loaded sites from frame-busting.

- Expose setting for non-.com TLDs

- Expose setting for same-sex name combinations.
