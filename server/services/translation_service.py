import re
import glob2


class TranslationService:
    @staticmethod
    def refresh_translatables():
        """
        Read through frontend files and extract translatable strings
        """

        # Get translatable strings
        strings = TranslationService._get_translatables()

        # Replace english language file, which is the source for translation
        output = open("client/locale/en.json", "w")
        output.write("{\n")
        counter = len(strings)
        for string in sorted(strings):
            if counter > 1:
                output.write('\t"%s": "%s",\n' % (string, string))
                counter = counter - 1
            else:
                output.write('\t"%s": "%s"\n' % (string, string))
        output.write("}\n")
        output.close()

    @staticmethod
    def _get_translatables():

        # Source files containing translation strings
        files = glob2.glob("client/app/**")
        files.append("client/index.html")

        # Regular expression to detect translation strings
        translate_string = re.compile(
            r"\{\{\s*['\"]([^\|]*)['\"]\s*\|\s+translate\s*\}\}"
        )

        # Assemble the data
        strings = []
        for f in files:

            # Read in frontend files
            try:
                text = open(f, "r").readlines()
            except Exception:
                continue
            for line in text:

                # Identify translation string
                matches = translate_string.findall(line)
                if len(matches) > 0:

                    # Add translation string to strings array
                    for match in matches:
                        if match not in strings:
                            strings.append(match)
        return strings
