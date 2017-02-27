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

    it('should return a task grid with 10 features for an AOI and zoom level 18', function(){
        // Arrange
        var polygon = new ol.geom.Polygon([[
            [-440959.40412809426,7584157.594433298],
            [-440679.93124342663,7584367.796261082],
            [-440700.23482906487,7583837.514377355],
            [-440959.40412809426,7584157.594433298]
        ]]);
        var AOI = new ol.Feature({
            geometry: polygon
        });
        var zoom = 18;

        // Act
        var taskGrid = projectService.getTaskGrid(AOI, zoom);

        // Assert
        expect(taskGrid.length).toBe(10);
    });

    it('should return a task grid with 23 features for an AOI and zoom level 19', function(){
        // Arrange
        var polygon = new ol.geom.Polygon([[
            [-440959.40412809426,7584157.594433298],
            [-440679.93124342663,7584367.796261082],
            [-440700.23482906487,7583837.514377355],
            [-440959.40412809426,7584157.594433298]
        ]]);
        var AOI = new ol.Feature({
            geometry: polygon
        });
        var zoom = 19;

        // Act
        var taskGrid = projectService.getTaskGrid(AOI, zoom);

        // Assert
        expect(taskGrid.length).toBe(23);
    });
});

