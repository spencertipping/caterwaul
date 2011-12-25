all: caterwaul.min.js caterwaul.std.min.js caterwaul.ui.min.js

%.min.js: %.js
	yuicompressor $< -o $@

%.waul: %.waul.sdoc
	sdoc $<

%.js: %.js.sdoc
	sdoc $<

%.js: %.waul
	../waul $<
