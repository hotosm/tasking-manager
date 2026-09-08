
DRAW := $(wildcard *.odg)
PNGS := $(DRAW:.odg=.png)
PDFS := $(DRAW:.odg=.pdf)

# Automate the building of pngs and pdfs from the libreoffice draw
# source files, insted of having to commit both to git after
# any changes.
all: pngs pdfs
	@echo "$(DRAW)"

pngs: $(PNGS)

pdfs: $(PDFS)

apidoc:
	-@doxygen

%.png: %.odg
	@echo "Generating $@ file for use in Markdown files"
	-libreoffice --draw --headless --convert-to png "$<"
	# -@mv *Profile.png images/

%.pdf: %.odg
	@echo "Generating $@ file for use in Markdown files"
	-libreoffice --draw --headless --convert-to pdf "$<"
	# -@mv *Profile.png images

clean:
	-$(RM) *.png *.pdf

force:
