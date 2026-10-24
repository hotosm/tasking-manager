import unittest
from unittest.mock import AsyncMock, patch

from backend.models.dtos.project_dto import ProjectSearchDTO
from backend.services.project_search_service import ProjectSearchService


class TestProjectSearchDueDateOrder(unittest.IsolatedAsyncioTestCase):
    async def _build_list_query(self, order_by_type):
        search_dto = ProjectSearchDTO()
        search_dto.order_by = "due_date"
        search_dto.order_by_type = order_by_type
        search_dto.page = 1
        search_dto.omit_map_results = True

        db = AsyncMock()
        db.fetch_val.return_value = 0
        db.fetch_all.return_value = []

        with patch.object(
            ProjectSearchService,
            "create_search_query",
            AsyncMock(return_value=("SELECT p.id FROM projects p WHERE 1=1", "", "", {})),
        ):
            await ProjectSearchService._filter_projects(search_dto, None, db)

        # The last fetch_all call is the paginated list query.
        return db.fetch_all.call_args.args[0]

    async def test_due_date_asc_orders_upcoming_then_expired_then_null(self):
        query = await self._build_list_query("ASC")

        self.assertIn("WHEN p.due_date IS NULL THEN 2", query)
        self.assertIn("WHEN p.due_date >= (now() AT TIME ZONE 'UTC') THEN 0", query)
        self.assertIn("ELSE 1", query)
        self.assertIn("p.due_date DESC", query)
        self.assertTrue(query.rstrip().split("LIMIT")[0].rstrip().endswith("p.id DESC"))

    async def test_due_date_desc_keeps_plain_ordering(self):
        query = await self._build_list_query("DESC")

        self.assertIn("ORDER BY p.due_date DESC, p.id DESC", query)
        self.assertNotIn("WHEN p.due_date IS NULL", query)
