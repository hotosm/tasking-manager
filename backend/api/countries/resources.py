from backend.services.tags_service import TagsService
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends
from backend.db import get_session

router = APIRouter(
    prefix="/countries",
    tags=["countries"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

# class CountriesRestAPI(Resource):
@router.get("/")
async def get(session: AsyncSession = Depends(get_session)):
      """
      Fetch all Country tags
      ---
      tags:
        - countries
      produces:
        - application/json
      responses:
          200:
              description: All Country tags returned
          500:
              description: Internal Server Error
      """
      tags = await TagsService.get_all_countries(session)
      return tags.model_dump(by_alias=True), 200
