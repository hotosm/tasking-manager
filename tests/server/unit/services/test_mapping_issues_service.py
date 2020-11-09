import unittest
from server.services.mapping_service import Task, TaskHistory
from server.services.mapping_issues_service import MappingIssueCategoryService, MappingIssueExportService
from server.services.stats_service import StatsService
from server.models.dtos.mapping_issues_dto import MappingIssueCategoriesDTO, MappingIssueCategoryDTO
from server.models.dtos.stats_dto import ProjectContributionsDTO, UserContribution
from server.models.postgis.user import User
from server.models.postgis.task import TaskMappingIssue
from server.models.postgis.statuses import TaskStatus
from unittest.mock import patch, MagicMock, create_autospec
from server import create_app

class TestMappingIssueExportService(unittest.TestCase):

    """
    Mocked data:

    Users
    0 mapper0
    1 mapper1

    MappingIssueCategories
    0 trees
    1 flowers
    2 pebbles

    ProjectContribDTO
    userContribDTOs []
        contrib0
            username = mapper0
            tasks = 3
        contrib1
            username = mapper1
            tasks = 2

    Mock Project
        task_0
            task_status = validated
            mapper = mapper0
            id = 0 validated_by = mapper0 (0)
            task_history []
                history_0
                    id = 3
                    task_mapping_issues
                        issue=trees count=5 mapping_issue_category_id=0 task_history_id=3
                        pebbles 8  2  3
                history_1
                    id = 10
                    task_mapping_issues
                        flowers 4  1  3
        task_1
            task_status = validated
            mapper = mapper0
            id = 1
            validated_by = mapper1 (1)
            task_history []
                history_0
                    id = 8
                history_1
                    id = 2
                    task_mapping_issues
                        trees 9  0  2
        task_2
            task_status = validated
            mapper = mapper1
            id = 2
            validated_by = mapper0 (0)
            task_history []
                history_0
                    id = 2400
                    task_mapping_issues
                        trees 8  0  2400
                        flowers 2  1  2400
        task_3
            task_status = mapped
            mapper = mapper1
            id = 3
            task_history []
                history_0
                    id = 345
        task_4
            task_status = validated
            mapper = mapper0
            validated_by = mapper1 (1)
            id = 4
            task_history []
                history_0
                    id = 45
                    task_mapping_issues
                        pebbles 7  2  45
        task_5
            task_status = validated
            mapper = mapper1
            validated_by = mapper0
            id = 5
            task_history []
                history_0
                    id = 99

    output should be (without spaces):
    "Username (tasks mapped), trees, flowers, pebbles\n
    mapper0 (3), 14, 4, 15\n
    mapper1 (2), 8, 2, 0\n
    Project Totals, 22, 6, 15\n

    detailed:
    


    """

    @classmethod
    def setUpClass(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.mock_issue_categories_dto = MagicMock(spec=MappingIssueCategoriesDTO)
        self.mock_issue_categories_dto.categories = []
        self.mock_issue_categories_dto.categories.append(MappingIssueCategoryDTO())
        self.mock_issue_categories_dto.categories.append(MappingIssueCategoryDTO())
        self.mock_issue_categories_dto.categories.append(MappingIssueCategoryDTO())
        self.mock_issue_categories_dto.categories[0].category_id = 2
        self.mock_issue_categories_dto.categories[1].category_id = 0
        self.mock_issue_categories_dto.categories[2].category_id = 1
        self.mock_issue_categories_dto.categories[0].name = "pebbles"
        self.mock_issue_categories_dto.categories[1].name = "trees"
        self.mock_issue_categories_dto.categories[2].name = "flowers"

        self.all_tasks = []

        self.task_stub_0 = MagicMock(spec=Task)
        self.task_stub_0.task_status = TaskStatus.VALIDATED.value
        self.task_stub_0.mapper = MagicMock(User)
        self.task_stub_0.mapper.username = "mapper0"
        self.task_stub_0.id = 0
        self.task_stub_0.validated_by = 0
        self.task_stub_0.task_history = []
        self.task_stub_0.task_history.append(MagicMock(TaskHistory))
        self.task_stub_0.task_history[0].id = 3
        self.task_stub_0.task_history[0].task_mapping_issues = []

        issue_0_0 = MagicMock(spec=TaskMappingIssue)
        issue_0_0.issue = "trees"
        issue_0_0.count = 5
        issue_0_0.mapping_issue_category_id = 0
        issue_0_0.task_history_id = 3
        self.task_stub_0.task_history[0].task_mapping_issues.append(issue_0_0)

        issue_0_1 = MagicMock(spec=TaskMappingIssue)
        issue_0_1.issue = "flowers"
        issue_0_1.count = 4
        issue_0_1.mapping_issue_category_id = 1
        issue_0_1.task_history_id = 3
        self.task_stub_0.task_history[0].task_mapping_issues.append(issue_0_1)

        issue_0_2 = MagicMock(spec=TaskMappingIssue)
        issue_0_2.issue = "pebbles"
        issue_0_2.count = 8
        issue_0_2.mapping_issue_category_id = 2
        issue_0_2.task_history_id = 3
        self.task_stub_0.task_history[0].task_mapping_issues.append(issue_0_2)

        self.all_tasks.append(self.task_stub_0)

        '''
        task_1
            task_status = validated
            mapper = mapper0
            id = 1
            validated_by = mapper1
            task_history []
                history_0
                    id = 8
                history_1
                    id = 2
                    task_mapping_issues
                        trees 9  0  2
        '''

        self.task_stub_1 = MagicMock(spec=Task)
        self.task_stub_1.task_status = TaskStatus.VALIDATED.value
        self.task_stub_1.mapper = MagicMock(spec=User)
        self.task_stub_1.mapper.username = "mapper0"
        self.task_stub_1.id = 1
        self.task_stub_1.validated_by = 1
        self.task_stub_1.task_history = []
        self.task_stub_1.task_history.append(MagicMock(spec=TaskHistory))
        self.task_stub_1.task_history[0].id = 8
        self.task_stub_1.task_history[0].task_mapping_issues = []
        self.task_stub_1.task_history.append(MagicMock(spec=TaskHistory))
        self.task_stub_1.task_history[1].id = 2
        self.task_stub_1.task_history[1].task_mapping_issues = []

        issue_1_0 = MagicMock(spec=TaskMappingIssue)
        issue_1_0.issue = "trees"
        issue_1_0.count = 9
        issue_1_0.mapping_issue_category_id = 0
        issue_1_0.task_history_id = 2
        self.task_stub_1.task_history[1].task_mapping_issues.append(issue_1_0)

        self.all_tasks.append(self.task_stub_1)

        '''
        task_2
            task_status = validated
            mapper = mapper1
            id = 2
            validated_by = mapper0
            task_history []
                history_0
                    id = 2400
                    task_mapping_issues
                        trees 8  0  2400
                        flowers 2  1  2400
        '''

        self.task_stub_2 = MagicMock(spec=Task)
        self.task_stub_2.task_status = TaskStatus.VALIDATED.value
        self.task_stub_2.mapper = MagicMock(spec=User)
        self.task_stub_2.mapper.username = "mapper1"
        self.task_stub_2.id = 2
        self.task_stub_2.validated_by = 0
        self.task_stub_2.task_history = []
        self.task_stub_2.task_history.append(MagicMock(spec=TaskHistory))
        self.task_stub_2.task_history[0].id = 2400
        self.task_stub_2.task_history[0].task_mapping_issues = []

        issue_2_0 = MagicMock(spec=TaskMappingIssue)
        issue_2_0.issue = "trees"
        issue_2_0.count = 8
        issue_2_0.mapping_issue_category_id = 0
        issue_2_0.task_history_id = 2400
        self.task_stub_2.task_history[0].task_mapping_issues.append(issue_2_0)

        issue_2_1 = MagicMock(spec=TaskMappingIssue)
        issue_2_1.issue = "flowers"
        issue_2_1.count = 2
        issue_2_1.mapping_issue_category_id = 1
        issue_2_1.task_history_id = 2400
        self.task_stub_2.task_history[0].task_mapping_issues.append(issue_2_1)

        self.all_tasks.append(self.task_stub_2)

        '''
        task_3
            task_status = mapped
            mapper = mapper1
            id = 3
            task_history []
                history_0
                    id = 345
        '''

        self.task_stub_3 = MagicMock(spec=Task)
        self.task_stub_3.task_status = TaskStatus.MAPPED.value
        self.task_stub_3.mapper = MagicMock(spec=User)
        self.task_stub_3.mapper.username = "mapper1"
        self.task_stub_3.id = 3
        self.task_stub_3.task_history = []
        self.task_stub_3.task_history.append(MagicMock(spec=TaskHistory))
        self.task_stub_3.task_history[0].id = 345

        self.all_tasks.append(self.task_stub_3)

        '''
        task_4
            task_status = validated
            mapper = mapper0
            id = 4
            validated_by = mapper1 (1)
            task_history []
                history_0
                    id = 45
                    task_mapping_issues
                        pebbles 7  2  45
        '''

        self.task_stub_4 = MagicMock(spec=Task)
        self.task_stub_4.task_status = TaskStatus.VALIDATED.value
        self.task_stub_4.mapper = MagicMock(spec=User)
        self.task_stub_4.mapper.username = "mapper0"
        self.task_stub_4.id = 4
        self.task_stub_4.validated_by = 1
        self.task_stub_4.task_history = []
        self.task_stub_4.task_history.append(MagicMock(spec=TaskHistory))
        self.task_stub_4.task_history[0].id = 67
        self.task_stub_4.task_history[0].task_mapping_issues = []

        issue_4_0 = MagicMock(spec=TaskMappingIssue)
        issue_4_0.issue = "pebbles"
        issue_4_0.count = 7
        issue_4_0.mapping_issue_category_id = 2
        issue_4_0.task_history_id = 45
        self.task_stub_4.task_history[0].task_mapping_issues.append(issue_4_0)

        self.all_tasks.append(self.task_stub_4)

        '''
        task_5
            task_status = validated
            mapper = mapper1
            validated_by = mapper0
            id = 5
            task_history []
                history_0
                    id = 99
        '''
        self.task_stub_5 = MagicMock(spec=Task)
        self.task_stub_5.task_status = TaskStatus.VALIDATED.value
        self.task_stub_5.mapper = MagicMock(spec=User)
        self.task_stub_5.mapper.username = "mapper1"
        self.task_stub_5.id = 5
        self.task_stub_5.validated_by = 0
        self.task_stub_5.task_history = []

        self.all_tasks.append(self.task_stub_5)


        self.mock_get_all_tasks = create_autospec(Task.get_all_tasks, return_value=self.all_tasks)

        self.mock_proj_contrib_dto = MagicMock(spec=ProjectContributionsDTO)
        self.mock_proj_contrib_dto.user_contributions = []

        user_contrib_0 = MagicMock(spec=UserContribution)
        user_contrib_0.username = "mapper0"
        user_contrib_0.mapped = 3

        user_contrib_1 = MagicMock(spec=UserContribution)
        user_contrib_1.username = "mapper1"
        user_contrib_1.mapped = 2

        self.mock_proj_contrib_dto.user_contributions.append(user_contrib_0)
        self.mock_proj_contrib_dto.user_contributions.append(user_contrib_1)

    @classmethod
    def tearDownClass(self):
        self.ctx.pop()


    def test_categories(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()

            export_result = export_service.get_mapping_issues(2, "false", "false")
            
            self.assertEqual("trees", export_service.category_names_dict[1])
            self.assertEqual("flowers", export_service.category_names_dict[2])
            self.assertEqual("pebbles", export_service.category_names_dict[3])


    def test_category_totals(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()

            export_result = export_service.get_mapping_issues(2, "false", "false")

            self.assertEqual(22, export_service.totals[1])
            self.assertEqual(6, export_service.totals[2])
            self.assertEqual(15, export_service.totals[3])

    def test_user_totals(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()

            export_result = export_service.get_mapping_issues(2, "false", "false")

            user_issue_totals = export_service.user_issue_totals

            self.assertEqual(str(14), user_issue_totals["mapper0"][1])
            self.assertEqual(str(4), user_issue_totals["mapper0"][2])
            self.assertEqual(str(15), user_issue_totals["mapper0"][3])

            self.assertEqual(str(8), user_issue_totals["mapper1"][1])
            self.assertEqual(str(2), user_issue_totals["mapper1"][2])
            self.assertEqual(str(0), user_issue_totals["mapper1"][3])


    def test_categories_detailed(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()

            export_result = export_service.get_mapping_issues(2, "true", "true")

            self.assertEqual("trees", export_service.category_names_dict[1])
            self.assertEqual("flowers", export_service.category_names_dict[2])
            self.assertEqual("pebbles", export_service.category_names_dict[3])


    def test_category_totals_detailed(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()

            export_result = export_service.get_mapping_issues(2, "true", "true")

            self.assertEqual(22, export_service.totals[1])
            self.assertEqual(6, export_service.totals[2])
            self.assertEqual(15, export_service.totals[3])


    def test_user_totals_detailed(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()
            export_result = export_service.get_mapping_issues(2, "true", "true")
            user_issue_totals = export_service.user_issue_totals

            self.assertEqual(str(14), user_issue_totals["mapper0"][2])
            self.assertEqual(str(4), user_issue_totals["mapper0"][3])
            self.assertEqual(str(15), user_issue_totals["mapper0"][4])

            self.assertEqual(str(8), user_issue_totals["mapper1"][2])
            self.assertEqual(str(2), user_issue_totals["mapper1"][3])
            self.assertEqual(str(0), user_issue_totals["mapper1"][4])


    def test_individual_task_issues_detailed(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()
            export_result = export_service.get_mapping_issues(2, "true", "true")
            single_task_rows = export_service.single_task_rows

            "validated tasks: 0, 1, 2, 4, 5"
            "issue order: trees flowers pebbles"
            self.assertEqual(str(self.task_stub_0.task_history[0].task_mapping_issues[0].count), single_task_rows[0][2]) 
            self.assertEqual(str(self.task_stub_0.task_history[0].task_mapping_issues[1].count), single_task_rows[0][3]) 
            self.assertEqual(str(self.task_stub_0.task_history[0].task_mapping_issues[2].count), single_task_rows[0][4]) 

            self.assertEqual(str(self.task_stub_1.task_history[1].task_mapping_issues[0].count), single_task_rows[1][2]) 
            self.assertEqual(str(0), single_task_rows[1][3]) 
            self.assertEqual(str(0), single_task_rows[1][4]) 

            self.assertEqual(str(self.task_stub_2.task_history[0].task_mapping_issues[0].count), single_task_rows[2][2]) 
            self.assertEqual(str(self.task_stub_2.task_history[0].task_mapping_issues[1].count), single_task_rows[2][3]) 
            self.assertEqual(str(0), single_task_rows[2][4]) 

            self.assertEqual(str(0), single_task_rows[4][2]) 
            self.assertEqual(str(0), single_task_rows[4][3]) 
            self.assertEqual(str(self.task_stub_4.task_history[0].task_mapping_issues[0].count), single_task_rows[4][4]) 

            self.assertEqual(str(0), single_task_rows[5][2]) 
            self.assertEqual(str(0), single_task_rows[5][3]) 
            self.assertEqual(str(0), single_task_rows[5][4]) 


    def test_hiding_zeros_rows_detailed(self):

        with patch.object(Task, 'get_all_tasks', return_value=self.all_tasks),\
                patch.object(StatsService, 'get_user_contributions', return_value=self.mock_proj_contrib_dto),\
                patch.object(User, 'get_by_id', return_value=None, side_effect=self.get_user),\
                patch.object(MappingIssueCategoryService, 'get_all_mapping_issue_categories', return_value=self.mock_issue_categories_dto):

            export_service = MappingIssueExportService()
            export_result = export_service.get_mapping_issues(2, "true", "false")

            self.assertEqual(-1, export_result.find("0,0,0"))


    def get_user(*args):
        user = MagicMock(spec=User)
        if args[2] == 0:
            user.username = "mapper0"
            return user
        elif args[2] == 1:
            user.username = "mapper1"
            return user
