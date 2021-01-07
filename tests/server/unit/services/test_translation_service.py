import unittest
from server.services.translation_service import TranslationService


class TestTranslationService(unittest.TestCase):

    def test_translation_source_file_contains_all_translatables(self):
        # Arrange

        # Read the strings from language file
        current_file = open('client/locale/en.json', 'r')
        current_strings = current_file.readlines()[1:-1]
        current_file.close()

        # Get translatables from code base
        translatables_raw = TranslationService._get_translatables()
        translatables = []
        counter = len(translatables_raw)
        for string in sorted(translatables_raw):
            if counter > 1:
                translatables.append('\t"%s": "%s",\n' % (string, string))
                counter = counter - 1
            else:
                translatables.append('\t"%s": "%s"\n' % (string, string))

        # Act

        # Compare strings between current and new code base
        count_new_strings = 0
        count_removed_strings = 0
        for word in translatables:
            if word not in current_strings:
                count_new_strings += 1
        for word in current_strings:
            if word not in translatables:
                count_removed_strings += 1

        # Assert
        # self.assertEqual(count_removed_strings, 0)
        # self.assertEqual(count_new_strings, 0)
