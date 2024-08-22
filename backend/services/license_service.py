from backend.models.dtos.licenses_dto import LicenseDTO, LicenseListDTO
from backend.models.postgis.licenses import License
from databases import Database
from backend.db import get_db
from fastapi import Depends, Request, HTTPException


class LicenseService:
    @staticmethod
    def get_license(license_id: int, db:Database) -> License:
        """
        Get task from DB
        :raises: NotFound
        """
        map_license = License.get_by_id(license_id)
        return map_license

    @staticmethod
    async def get_license_as_dto(license_id: int, db:Database) -> LicenseDTO:
        """Get License from DB"""
        query = """
            SELECT id AS "licenseId", name, description, plain_text AS "plainText"
            FROM licenses
            WHERE id = :license_id
        """
        license_dto = await db.fetch_one(query, {"license_id": license_id})
        return LicenseDTO(**license_dto)

    @staticmethod
    async def create_license(license_dto: LicenseDTO, db:Database) -> int:
        """Create License in DB"""
        new_license_id = await License.create_from_dto(license_dto, db)
        return new_license_id

    @staticmethod
    async def update_license(license_dto: LicenseDTO, license_id: int, db: Database) -> LicenseDTO:
        """Create License in DB"""

        query = """
            UPDATE licenses
            SET name = :name, description = :description, plain_text = :plain_text
            WHERE id = :license_id
        """

        values = {
            "name": license_dto.name,
            "description": license_dto.description,
            "plain_text": license_dto.plain_text,
        }
        await db.execute(query, values={**values, 'license_id': license_id})

    @staticmethod
    async def delete_license(license_id: int, db: Database):
        """Delete specified license"""
        query = """
            DELETE FROM licenses
            WHERE id = :license_id;
        """
        try:
            async with db.transaction():
                await db.execute(query, {"license_id": license_id})
        except Exception as e:
            raise HTTPException(
                status_code=500, detail="Deletion failed"
            ) from e

    @staticmethod
    async def get_all_licenses(db: Database) -> LicenseListDTO:
        """Gets all licenses currently stored"""
        query = """
            SELECT id AS "licenseId", name, description, plain_text AS "plainText"
            FROM licenses
        """
        results = await db.fetch_all(query)

        lic_dto = LicenseListDTO()
        for record in results:
            l_dto = LicenseDTO(**record)
            lic_dto.licenses.append(l_dto)
        return lic_dto
