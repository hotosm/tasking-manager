from backend.models.postgis.utils import sanitize_markdown


def test_sanitize_markdown_allows_details_and_summary():
    """Collapsible sections in project instructions must survive sanitizing."""
    text = (
        "<details>\n  <summary>1. Adjust area</summary>\n  <p>Some text</p>\n</details>"
    )

    result = sanitize_markdown(text)

    assert "<details>" in result
    assert "<summary>1. Adjust area</summary>" in result
    assert "&lt;details&gt;" not in result


def test_sanitize_markdown_still_blocks_scripts_and_styles():
    """Allowing details/summary must not open the door to unsafe HTML."""
    text = '<script>alert(1)</script>\n\n<span style="color:red">red</span>'

    result = sanitize_markdown(text)

    assert "<script" not in result
    assert "style=" not in result
