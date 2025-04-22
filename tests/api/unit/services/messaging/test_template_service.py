import pytest
from backend.services.messaging.template_service import (
    clean_html,
    format_username_link,
    get_template,
    template_var_replacing,
)
from backend.config import test_settings as settings


@pytest.mark.anyio
class TestTemplateService:
    def test_variable_replacing(self):
        # Act
        values = {"USERNAME": "USERNAME", "VERIFICATION_LINK": "VERIFICATION_LINK"}
        content = get_template("email_verification_en.html", values)
        replace_list = [
            ["USERNAME", "test_user"],
            ["VERIFICATION_LINK", "http://localhost:30/verify.html#1234"],
            [settings.ORG_CODE, "HOT"],
            [settings.ORG_NAME, "Organization Test"],
        ]
        processed_content = template_var_replacing(content, replace_list)

        # Assert
        assert "test_user" in processed_content
        assert "http://localhost:30/verify.html#1234" in processed_content
        assert "HOT" in processed_content
        assert "Organization Test" in processed_content

        assert "[USERNAME]" not in processed_content
        assert "[VERIFICATION_LINK]" not in processed_content
        assert "[ORG_CODE]" not in processed_content
        assert "[ORG_NAME]" not in processed_content

    def test_clean_html(self):
        result = clean_html(
            'Welcome to <a href="https://tasks.hotosm.org">Tasking Manager</a>!'
        )
        assert result == "Welcome to Tasking Manager!"

    def test_format_username_link(self):
        base_url = settings.APP_BASE_URL

        result = format_username_link("try @[yo] @[us2]! [t](http://a.c)")
        expected = (
            f'try <a style="color: #d73f3f" href="{base_url}/users/yo/">@yo</a>'
            f' <a style="color: #d73f3f" href="{base_url}/users/us2/">@us2</a>! [t](http://a.c)'
        )
        assert result == expected

        result = format_username_link(
            "testing @user! Write me at i@we.com [test](http://link.com)"
        )
        assert result == "testing @user! Write me at i@we.com [test](http://link.com)"
