import pytest

from backend.models.postgis.utils import markdown_to_html, sanitize_markdown


class TestSaneHeadings:
    """A line starting with '#' is a hashtag unless a space follows the '#'s."""

    def test_hashtag_at_start_of_comment_is_not_a_heading(self):
        html = markdown_to_html("#hotosm-project-1234 mapped the last task")

        assert "<h1>" not in html
        assert "#hotosm-project-1234 mapped the last task" in html

    def test_multiple_hashes_at_start_are_not_a_heading(self):
        assert "<h2>" not in markdown_to_html("##hotosm-project-1234")
        assert "<h3>" not in markdown_to_html("###tag")

    def test_heading_with_space_still_renders(self):
        html = markdown_to_html("# Project instructions")

        assert "<h1>Project instructions</h1>" in html

    def test_heading_after_text_still_renders(self):
        html = markdown_to_html("Some text\n\n## Next section")

        assert "<h2>Next section</h2>" in html

    def test_hashtag_inside_a_paragraph_is_unchanged(self):
        html = markdown_to_html("Mapped everything in #hotosm-project-1234")

        assert "<p>Mapped everything in #hotosm-project-1234</p>" in html

    def test_hashtag_line_between_paragraphs(self):
        html = markdown_to_html("Before\n\n#tag\n\nAfter")

        assert "<h1>" not in html
        assert "<p>#tag</p>" in html

    def test_hashtag_in_fenced_code_block_is_unchanged(self):
        html = markdown_to_html("```\n# not a heading\n```")

        assert "<h1>" not in html
        assert "# not a heading" in html
        assert "\\#" not in html

    def test_hashtag_in_indented_code_block_is_unchanged(self):
        html = markdown_to_html("    # not a heading")

        assert "<h1>" not in html
        assert "# not a heading" in html
        assert "\\#" not in html

    def test_hashtag_in_inline_code_is_unchanged(self):
        html = markdown_to_html("`#tag`")

        assert "<code>#tag</code>" in html

    def test_seven_hashes_are_not_a_heading(self):
        assert "<h" not in markdown_to_html("#######seven")


class TestSanitizeMarkdown:
    def test_hashtag_at_start_of_description_is_not_a_heading(self):
        html = sanitize_markdown("#hotosm-project-1234\n\nMapping instructions")

        assert "<h1>" not in html
        assert "#hotosm-project-1234" in html

    def test_heading_with_space_still_renders(self):
        assert "<h1>About</h1>" in sanitize_markdown("# About")

    def test_empty_input_returns_none(self):
        assert sanitize_markdown("") is None
        assert sanitize_markdown(None) is None


@pytest.mark.parametrize(
    "text",
    [
        "#tag",
        "##tag",
        "#hotosm-project-1234 mapped everything",
        "text\n#tag",
    ],
)
def test_conversion_keeps_text_verbatim(text):
    """The rendered text is the text the contributor wrote."""
    assert "\\#" not in markdown_to_html(text)
