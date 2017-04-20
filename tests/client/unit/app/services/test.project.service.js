'use strict';

describe('project.service', function () {
    var projectService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_projectService_) {
            projectService = _projectService_;
        });
    });

    it('should be created successfully', function () {
        expect(projectService).toBeDefined()
    });

    it('should return a task grid with 10 features for an AOI and zoom level 18', function () {
        // Arrange
        var polygon = new ol.geom.Polygon([[
            [-440959.40412809426, 7584157.594433298],
            [-440679.93124342663, 7584367.796261082],
            [-440700.23482906487, 7583837.514377355],
            [-440959.40412809426, 7584157.594433298]
        ]]);
        var AOI = new ol.Feature({
            geometry: polygon
        });
        var zoom = 18;

        // Act
        var grid = projectService.createTaskGrid(AOI, zoom);
        projectService.setTaskGrid(grid);
        var taskGrid = projectService.getTaskGrid();

        // Assert
        expect(taskGrid.length).toBe(10);
    });

    it('should return a task grid with 23 features for an AOI and zoom level 19', function () {
        // Arrange
        var polygon = new ol.geom.Polygon([[
            [-440959.40412809426, 7584157.594433298],
            [-440679.93124342663, 7584367.796261082],
            [-440700.23482906487, 7583837.514377355],
            [-440959.40412809426, 7584157.594433298]
        ]]);
        var AOI = new ol.Feature({
            geometry: polygon
        });
        var zoom = 19;

        // Act
        var grid = projectService.createTaskGrid(AOI, zoom);
        projectService.setTaskGrid(grid);
        var taskGrid = projectService.getTaskGrid();

        // Assert
        expect(taskGrid.length).toBe(23);
    });

    it('should return a VALID result when validating an array of non self intersecting features', function () {
        //Arrange
        var polygon = new ol.geom.Polygon([[
            [-440959.40412809426, 7584157.594433298],
            [-440679.93124342663, 7584367.796261082],
            [-440700.23482906487, 7583837.514377355],
            [-440959.40412809426, 7584157.594433298]
        ]]);
        var feature = new ol.Feature({
            geometry: polygon
        });

        var features = [feature];

        //Act
        var result = projectService.validateAOI(features);

        //Assert
        expect(result).toEqual({
            valid: true,
            message: ''
        })
    });

    it('should return an INVALID NO_FEATURES result when validating an empty array', function () {
        //Arrange
        var features = [];

        //Act
        var result = projectService.validateAOI(features);

        //Assert
        expect(result).toEqual({
            valid: false,
            message: 'NO_FEATURES'
        })
    });

    it('should return an INVALID NO_FEATURES result when validating a null object', function () {
        //Arrange
        var features = null;

        //Act
        var result = projectService.validateAOI(features);

        //Assert
        expect(result).toEqual({
            valid: false,
            message: 'NO_FEATURES'
        })
    });

    it('should return an INVALID NO_FEATURES result when validating an unexpected object class', function () {
        //Arrange
        var car = {
            make: 'ford',
            model: 'T'
        };

        //Act
        var result = projectService.validateAOI(car);

        //Assert
        expect(result).toEqual({
            valid: false,
            message: 'NO_FEATURES'
        })
    });

    it('should return an INVALID UNKNOWN_OBJECT_CLASS result when validating an array containing an unexpected object class', function () {
        //Arrange
        var car = {
            make: 'ford',
            model: 'T'
        };

        var cars = [car];

        //Act
        var result = projectService.validateAOI(cars);

        //Assert
        expect(result).toEqual({
            valid: false,
            message: 'UNKNOWN_OBJECT_CLASS'
        })
    });

    it('should return an INVALID SELF_INTERSECTION result when validating an array containing self intersecting polygon features', function () {

        var polygon1 = new ol.geom.Polygon([[
            [0, 0],
            [1, 1],
            [-1, 1],
            [0, 1],
            [0, 0]
        ]]);
        var feature1 = new ol.Feature({
            geometry: polygon1
        });

        var polygon2 = new ol.geom.Polygon([[
            [0, 0],
            [1, 1],
            [-1, 1],
            [0, 1],
            [0, 0]
        ]]);
        var feature2 = new ol.Feature({
            geometry: polygon2
        });

        var features = [feature1, feature2];

        //Act
        var result = projectService.validateAOI(features);

        //Assert
        expect(result).toEqual({
            valid: false,
            message: 'SELF_INTERSECTIONS'
        })
    });

    it('should return an INVALID SELF_INTERSECTION result when validating a multipolygon containing a self intersection', function () {

        var multipolygon = new ol.geom.MultiPolygon([[[
            [0, 0],
            [1, 1],
            [-1, 1],
            [0, 1],
            [0, 0]
        ]]]);
        var feature = new ol.Feature({
            geometry: multipolygon
        });

        var features = [feature];

        //Act
        var result = projectService.validateAOI(features);

        //Assert
        expect(result).toEqual({
            valid: false,
            message: 'SELF_INTERSECTIONS'
        })
    });

    it('should return an VALID result when validating a multipolygon containing no self intersections', function () {

        var multipolygon = new ol.geom.MultiPolygon([[[
            [0, 0],
            [1, 1],
            [-1, 1],
            [-1, 0],
            [0, 0]
        ]]]);
        var feature = new ol.Feature({
            geometry: multipolygon
        });

        var features = [feature];

        //Act
        var result = projectService.validateAOI(features);

        //Assert
        expect(result).toEqual({
            valid: true,
            message: ''
        })
    });

    it('should return expected result for user can map for all mapper and project level contributions', function () {
        //Arrange a set of scearios to test includinf the expected result
        var scenarios = [
            {
                userLevel: 'BEGINNER',
                projectLevel: 'BEGINNER',
                enforce: true,
                expected: true
            },
            {
                userLevel: 'BEGINNER',
                projectLevel: 'INTERMEDIATE',
                enforce: true,
                expected: false
            },
            {
                userLevel: 'BEGINNER',
                projectLevel: 'ADVANCED',
                enforce: true,
                expected: false
            },
            {
                userLevel: 'INTERMEDIATE',
                projectLevel: 'BEGINNER',
                enforce: true,
                expected: true
            },
            {
                userLevel: 'INTERMEDIATE',
                projectLevel: 'INTERMEDIATE',
                enforce: true,
                expected: true
            },
            {
                userLevel: 'INTERMEDIATE',
                projectLevel: 'ADVANCED',
                enforce: true,
                expected: false
            },
            {
                userLevel: 'ADVANCED',
                projectLevel: 'BEGINNER',
                enforce: true,
                expected: true
            },
            {
                userLevel: 'ADVANCED',
                projectLevel: 'INTERMEDIATE',
                enforce: true,
                expected: true
            },
            {
                userLevel: 'ADVANCED',
                projectLevel: 'ADVANCED',
                enforce: true,
                expected: true
            }
        ];

        //Act
        var results = scenarios.map(function (scenario) {
            return {
                expected: scenario.expected,
                actual: projectService.userCanMapProject(scenario.userLevel, scenario.projectLevel, scenario.enforce)
            }
        });

        //Assert
        expect(results.every(function (element, index, array) {
            //leave this in to help debug tests if they fail
            if (element.expected !== element.actual) {
                console.log('Fail index ' + index);
            }
            return element.expected === element.actual;
        })).toBe(true);

    });

    it('should return expected result for user can validate for all user and project role contributions', function () {
        //Arrange a set of scearios to test including the expected result
        var scenarios = [
            //'ADMIN', 'PROJECT_MANAGER', 'VALIDATOR'
            {
                userRole: 'MAPPER',
                enforce: true,
                expected: false
            },
            {
                userRole: 'MAPPER',
                enforce: false,
                expected: true
            },
            {
                userRole: 'ADMIN',
                enforce: true,
                expected: true
            },
            {
                userRole: 'ADMIN',
                enforce: false,
                expected: true
            },
            {
                userRole: 'PROJECT_MANAGER',
                enforce: true,
                expected: true
            },
            {
                userRole: 'PROJECT_MANAGER',
                enforce: false,
                expected: true
            },
            {
                userRole: 'VALIDATOR',
                enforce: true,
                expected: true
            },
            {
                userRole: 'VALIDATOR',
                enforce: false,
                expected: true
            }
        ];

        //Act
        var results = scenarios.map(function (scenario) {
            return {
                expected: scenario.expected,
                actual: projectService.userCanValidateProject(scenario.userRole, scenario.enforce)
            }
        });

        //Assert
        expect(results.every(function (element, index, array) {
            //leave this in to help debug tests if they fail
            if (element.expected !== element.actual) {
                console.log('Fail index ' + index);
            }
            return element.expected === element.actual;
        })).toBe(true);

    });
});

