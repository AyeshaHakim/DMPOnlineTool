var app = angular.module('dmpOnlineTool', ['ngMaterial', 'ngMessages']);


app.controller('formCtrl', function($scope, $http, $log, $rootScope, appPageService) {

    $scope.appPageService = appPageService;
    $scope.dmp = {
        //Define project
        //dmpCreatedDate should be populated automatically
        //lastUpdateDate should be populated automatically
        //If endDate is empty, project is ongoing
        project: {
            title: "Title",
            description: "Desc",
            fieldOfResearch: "000",
            dmpCreatedDate: new Date(),
            lastUpdateDate: new Date(),
            lastAccessDate: new Date(),
            startDate: new Date(),
            endDate: ""
        },
        contributors: [new Contributor(0)]
    };

    //Will need to be changed to support loading.
    $scope.nextContributorID = 1;

    //A class for contributors
    function Contributor(id) {
        this.id = id;
        this.firstname = id;
        this.affiliation = "";
        this.email = "";
        this.username = "";
        this.orcid = "";
    }

    $scope.postStatus = "";

    //Saves the data to the server
    $scope.save = function() {
        $scope.dmp.project.lastUpdateDate = new Date();
        $http({
            method: "POST",
            url: "php/receiver.php",
            data: $scope.dmp
        }).then(function mySuccess(response) {
            $scope.postStatus = response.data;
        }, function myError(response) {
            $scope.postStatus = response.statusText;
        });
    };

    //Adds a contributor to the DMP
    $scope.addContributor = function() {
        var newContributor = new Contributor($scope.nextContributorID);
        $scope.nextContributorID++;
        $scope.dmp.contributors.push(newContributor);
    };

    //Deletes a contributor by id.
    $scope.deleteContributor = function(id) {
        for (i = $scope.dmp.contributors.length - 1; i >= 0; i--) {
            if ($scope.dmp.contributors[i].id == id) {
                $scope.dmp.contributors.splice(i, 1);
            }
        }
    };

    //Loads the data from the server
    $scope.load = function() {
        $http.get('php/dmp.json')
            .then(function mySuccess(response) {
                $scope.getStatus = response.data;
                $scope.dmp = $scope.getStatus;
                $scope.dmp.project.dmpCreatedDate = new Date($scope.dmp.project.dmpCreatedDate);
                $scope.dmp.project.lastUpdateDate = new Date($scope.dmp.project.lastUpdateDate);
                $scope.dmp.project.lastAccessDate = new Date();
                $scope.dmp.project.startDate = new Date($scope.dmp.project.startDate);
                if (($scope.dmp.project.endDate !== '')) {
                    $scope.dmp.project.endDate = new Date($scope.dmp.project.endDate);
                }
            }, function myError(response) {
                $scope.getStatus = response.statusText;
            });
    };
});
app.controller('sideNavCtrl', function($scope, $timeout, $mdSidenav, $log, $rootScope, appPageService) {

    $scope.appPageService = appPageService;

    $scope.toggleLeft = buildDelayedToggler('left');

    /**
     * Supplies a function that will continue to operate until the
     * time is up.
     */
    function debounce(func, wait, context) {
        var timer;

        return function debounced() {
            var context = $scope,
                args = Array.prototype.slice.call(arguments);
            $timeout.cancel(timer);
            timer = $timeout(function() {
                timer = undefined;
                func.apply(context, args);
            }, wait || 10);
        };
    }

    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildDelayedToggler(navID) {
        return debounce(function() {
            // Component lookup should always be available since we are not using `ng-if`
            $mdSidenav(navID)
                .toggle()
                .then(function() {
                    $log.debug("toggle " + navID + " is done");
                });
        }, 200);
    }

    function buildToggler(navID) {
        return function() {
            // Component lookup should always be available since we are not using `ng-if`
            $mdSidenav(navID)
                .toggle()
                .then(function() {
                    $log.debug("toggle " + navID + " is done");
                });
        };
    }
});
app.controller('LeftCtrl', function($scope, $timeout, $mdSidenav, $log) {
    $scope.close = function() {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav('left').close()
            .then(function() {
                $log.debug("close LEFT is done");
            });

    };
});


//Passes view information around the place
app.service('appPageService', function() {
    var appPage = this;

    this.pageID = 'project';

    // return {
    //     getAppPage: function() {
    //         return appPage;
    //     },
    //     setAppPage: function(value) {
    //         appPage = value;
    //     },
    // };
});
