import xml.etree.ElementTree as ET


class AuthenticationService:

    def login_user(self, osm_user_details):

        user = osm_user_details.find('user')

        iain = user