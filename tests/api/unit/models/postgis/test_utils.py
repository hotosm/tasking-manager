from backend.models.postgis.utils import escape_like


def test_escape_like_escapes_wildcards_and_the_escape_character():
    assert escape_like("user_1") == "user\\_1"
    assert escape_like("100%") == "100\\%"
    assert escape_like("a\\b") == "a\\\\b"


def test_escape_like_leaves_plain_text_unchanged():
    assert escape_like("Nepal") == "Nepal"
    assert escape_like("") == ""
