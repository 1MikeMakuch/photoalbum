
all: images html swipebox swipeboxcss

images = dist/img/Album.png dist/img/book_bg2.jpg
imgsrcs = $(subst dist/img,src/cli/img,$(images))
images: $(images)
$(images):	$(imgsrcs)
	cp src/cli/img/$(@F) $@


html = dist/index.html
htmlsrcs = src/cli/index.html
html: $(html)
$(html): $(htmlsrcs)
	cp $< $@

swipebox = dist/img/icons.png dist/img/loader.gif
swipeboxsrcs = $(sbst dist/img,node_modules/swipebox/src/img,$(swipebox))
swipebox: $(swipebox)
$(swipebox): $(swipeboxsrcs)
	cp node_modules/swipebox/src/img/$(@F) $@

swipeboxcss:	dist/css/swipebox.css
dist/css/swipebox.css:	node_modules/swipebox/src/css/swipebox.css
	cp node_modules/swipebox/src/css/swipebox.css dist/css/swipebox.css


