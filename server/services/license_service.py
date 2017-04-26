from server.models.dtos.licenses_dto import LicenseDTO
from server.models.postgis.licenses import License


class LicenseService:

    @staticmethod
    def get_license(license_id: int) -> LicenseDTO:
        """ Get License from DB """
        return License.get_license_as_dto(license_id)

    @staticmethod
    def create_licence(license_dto: LicenseDTO):
        """ Create License in DB """
        License.create_from_dto(license_dto)