from server.models.dtos.licenses_dto import LicenseDTO
from server.models.postgis.licenses import License


class LicenseService:

    @staticmethod
    def create_licence(license_dto: LicenseDTO):
        License.create_from_dto(license_dto)