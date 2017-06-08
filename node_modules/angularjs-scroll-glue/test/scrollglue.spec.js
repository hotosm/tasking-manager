'use strict';

describe('the scroll glue directive', function(){
    var scope,
        $compile,
        $window,
        $document,
        templates = {
            simple: '<div style="height: 40px; overflow-y: scroll" scroll-glue><div style="height: 100px">hi {{name}}</div></div>',
            deactivated: '<div style="height: 40px; overflow-y: scroll" scroll-glue="false"><div style="height: 100px">hi {{name}}</div></div>',
            withBinding: '<div style="height: 40px; overflow-y: scroll" scroll-glue="glued"><div style="height: 100px">hi {{name}}</div></div>',
            withSubPropertyBinding: '<div style="height: 40px; overflow-y: scroll" scroll-glue="prop.glued"><div style="height: 100px">hi {{name}}</div></div>',
            withBindingTop: '<div style="height: 40px; overflow-y: scroll" scroll-glue-top="glued"><div style="height: 100px">hi {{name}}</div></div>',
        };

    beforeEach(module('luegg.directives'));

    beforeEach(module(function($provide) {
        $provide.value('$timeout', function(paramFct) {
            paramFct();
        });
    }));

    beforeEach(inject(function($rootScope, _$compile_, _$window_, _$document_){
        scope = $rootScope;
        $compile = _$compile_;
        $window = _$window_;
        $document = _$document_;
    }));

    afterEach(function(){
        scope.$destroy();
    });

    function compile(template){
        var directiveElement = $compile(template)(scope);
        var bodyElement = angular.element($document[0].body);
        bodyElement.append(directiveElement);
        return directiveElement[0];
    }

    it('should scroll to bottom of element on changes', function(){
        var element = compile(templates.simple);

        scope.name = "World";
        scope.$digest();

        expect(element.scrollTop).toBe(element.scrollHeight - element.clientHeight);
    });

    it('should be deactivated if the scrollGlue attribute is set to "false"', function(){
        var element = compile(templates.deactivated);

        scope.name = "World";
        scope.$digest();

        expect(element.scrollTop).toBe(0);
    });

    it('should turn off auto scroll after user scrolled manually', function(done){
        var element = compile(templates.simple);

        scope.$digest();
        element.scrollTop = 0;

        setTimeout(function(){
            scope.name = "World";
            scope.$digest();

            expect(element.scrollTop).toBe(0);

            done();
        }, 10);
    });

    it('should turn on auto scroll after user scrolled manually to bottom of element', function(done){
        var element = compile(templates.simple);

        scope.$digest();
        element.scrollTop = 0;

        setTimeout(function(){
            scope.$digest();
            expect(element.scrollTop).toBe(0);

            element.scrollTop = element.scrollHeight;
            setTimeout(function(){
                scope.$digest();

                expect(element.scrollTop).toBe(element.scrollHeight - element.clientHeight);

                done();
            });
        });
    });

    it('should turn off when the bound value is false', function(){
        scope.glued = true;

        var element = compile(templates.withBinding);

        scope.glued = false;
        scope.$digest();

        expect(element.scrollTop).toBe(0);
    });

    it('should update the bound value', function(done){
        scope.glued = true;

        var element = compile(templates.withBinding);

        scope.$digest();

        element.scrollTop = 0;

        setTimeout(function(){
            expect(scope.glued).toBe(false);
            done();
        });
    });

    it('should update the bound value in sub properties', function(done){
        scope.prop = {
            glued: true
        };

        var element = compile(templates.withSubPropertyBinding);

        scope.$digest();

        element.scrollTop = 0;

        setTimeout(function(){
            expect(scope.prop.glued).toBe(false);
            done();
        });
    });

    it('should scroll to top when using scroll-glue-top', function(){
        var element = compile(templates.withBindingTop);

        element.scrollTop = 100;

        scope.name = "World";
        scope.$digest();

        expect(element.scrollTop).toBe(element.scrollHeight - element.clientHeight);
    });

    it('should scroll on window resize if glued', function(done){
        var element = compile(templates.simple);

        var event = document.createEvent("HTMLEvents");
        event.initEvent("resize", true, true);
        $window.dispatchEvent(event);

        setTimeout(function(){
            expect(element.scrollTop).toBe(element.scrollHeight - element.clientHeight);
            done();
        });
    });
});
