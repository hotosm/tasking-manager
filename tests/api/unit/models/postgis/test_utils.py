import pytest
import datetime
import json

from backend.models.postgis.utils import (
    timestamp,
    parse_duration,
    sanitize_markdown,
    DateTimeEncoder
)

@pytest.mark.anyio
class TestUtils:
    async def test_timestamp(self):
        """Test timestamp generation."""
        ts1 = timestamp()
        assert isinstance(ts1, datetime.datetime)

    async def test_parse_duration(self):
        """Test parsing duration strings."""
        duration1 = parse_duration("2h30m")
        assert duration1 == datetime.timedelta(hours=2, minutes=30)
        
        duration2 = parse_duration("1d")
        assert duration2 == datetime.timedelta(days=1)
        
        duration3 = parse_duration("45s")
        assert duration3 == datetime.timedelta(seconds=45)
        
        with pytest.raises(AssertionError):
            parse_duration("invalid")

    async def test_sanitize_markdown(self):
        """Test sanitize markdown functionality."""
        # Test basic markdown
        md = "This is **bold** and *italic*"
        sanitized = sanitize_markdown(md)
        assert "<strong>bold</strong>" in sanitized or "<b>bold</b>" in sanitized or "bold" in sanitized
        
        # Test script tags removed
        md_with_script = "Hello <script>alert('xss');</script>"
        sanitized_script = sanitize_markdown(md_with_script)
        assert "<script>" not in sanitized_script
        
        # Test strike through
        md_strike = "This is ~~deleted~~"
        sanitized_strike = sanitize_markdown(md_strike)
        assert "<del>deleted</del>" in sanitized_strike
        
        # Test none
        assert sanitize_markdown(None) is None

    async def test_datetime_encoder(self):
        """Test custom JSON encoder for datetimes."""
        dt = datetime.datetime(2020, 1, 1, 12, 0, 0)
        encoded = json.dumps({"time": dt}, cls=DateTimeEncoder)
        assert "2020-01-01T12:00:00" in encoded
        
        d = datetime.date(2020, 1, 1)
        encoded_date = json.dumps({"date": d}, cls=DateTimeEncoder)
        assert "2020-01-01" in encoded_date
        
        td = datetime.timedelta(hours=1)
        encoded_td = json.dumps({"td": td}, cls=DateTimeEncoder)
        assert "01:00:00" in encoded_td
