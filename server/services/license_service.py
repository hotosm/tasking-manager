from server.models.dtos.licenses_dto import LicenseDTO, LicenseListDTO
from server.models.postgis.licenses import License
from server.models.postgis.utils import NotFound


class LicenseService:

    @staticmethod
    def get_license(license_id: int) -> License:
        """
        Get task from DB
        :raises: NotFound
        """
        map_license = License.get_by_id(license_id)

        if map_license is None:
            raise NotFound()

        return map_license

    @staticmethod
    def get_license_as_dto(license_id: int) -> LicenseDTO:
        """ Get License from DB """
        map_license = LicenseService.get_license(license_id)
        return map_license.as_dto()

    @staticmethod
    def create_licence(license_dto: LicenseDTO) -> int:
        """ Create License in DB """
        new_licence_id = License.create_from_dto(license_dto)
        return new_licence_id

    @staticmethod
    def update_licence(license_dto: LicenseDTO) -> LicenseDTO:
        """ Create License in DB """
        map_license = LicenseService.get_license(license_dto.license_id)
        map_license.update_license(license_dto)
        return map_license.as_dto()

    @staticmethod
    def delete_license(license_id: int):
        """ Delete specified license"""
        map_license = LicenseService.get_license(license_id)
        map_license.delete()

    @staticmethod
    def get_all_licenses() -> LicenseListDTO:
        """ Get all licenses in DB """
        return License.get_all()
