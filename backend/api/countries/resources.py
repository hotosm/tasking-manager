from backend.services.tags_service import TagsService
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
async def get():
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
      tags = TagsService.get_all_countries()
      return tags.model_dump(by_alias=True), 200
