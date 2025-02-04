from pydantic import BaseModel, Field
from typing import List, Optional


class LicenseDTO(BaseModel):
    """DTO used to define a mapping license"""

    license_id: Optional[int] = Field(None, alias="licenseId")
    name: Optional[str] = None
    description: Optional[str] = None
    plain_text: Optional[str] = Field(None, alias="plainText")


class LicenseListDTO(BaseModel):
    """DTO for all mapping licenses"""

    def __init__(self):
        super().__init__()
        self.licenses = []

    licenses: Optional[List[LicenseDTO]] = None
