/*jshint esversion: 6 */

var app = angular.module('dmpOnlineTool', ['ngMaterial', 'ngMessages']);


app.controller('formCtrl', function($scope, $http, $log, $rootScope, $mdDialog, appPageService, userDataService, helpTextService, fieldOfResearchService) {

    $scope.appPageService = appPageService;
    $scope.userDataService = userDataService;
    helpTextService.loadHelpText().then(function(response) {
        $scope.helpTextService = response.data;
    });
    $scope.fieldOfResearchService = fieldOfResearchService;
    fieldOfResearchService.loadFieldOfResearchArray();


    //ev is the dom click event to control the animation.
    //id is the contributor to delete on okay
    $scope.confirmDeleteContributor = function(ev, id) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Delete contributor?')
            // .textContent('Delete contributor: ' + )
            .targetEvent(ev)
            .ok('Okay')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function() {
            $scope.userDataService.deleteContributor(id);
        }, function() {});
    };

    //TODO: make this work
    //ev is the dom click event to control the animation.
    // func is the function to call on okay
    $scope.showConfirm = function(ev, func) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Delete contributor?')
            .textContent('All of the banks have agreed to forgive you your debts.')
            .targetEvent(ev)
            .ok('Okay')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function() {
            $scope.status = true;
        }, function() {
            $scope.status = false;
        });
    };




});
app.controller('sideNavCtrl', function($scope, $timeout, $mdSidenav, $log, $rootScope, appPageService, userDataService) {

    $scope.appPageService = appPageService;
    $scope.userDataService = userDataService;

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

//Control a help button, including its visibility hopefully.
app.controller('helpCtrl', function($scope,$timeout,$mdDialog) {
    $scope.helpButtonHidden=true;

    $scope.toggleHelpButton = function() {
      $scope.helpButtonHidden=!$scope.helpButtonHidden;
    };

    $scope.showHelpButton = function() {
      $scope.helpButtonHidden=false;
    };

    $scope.hideHelpButton = function() {
      $scope.helpButtonHidden=true;
    };

    $scope.hideHelpButtonDelayed = function() {
      $scope.hide=$timeout(function() {$scope.hideHelpButton();},600);
    };

    //ev is the dom click event to control the animation.
    $scope.helpBox = function(ev, title, body) {
        // Appending dialog to document.body to cover sidenav in docs app
        // Modal dialogs should fully cover application
        // to prevent interaction outside of dialog
        $timeout.cancel($scope.hide);
        $mdDialog.show(
            $mdDialog.alert()
            .parent(angular.element(document.querySelector('#popupContainer')))
            .clickOutsideToClose(true)
            .title(title)
            .textContent(body)
            .ariaLabel('Help box')
            .ok('Got it!')
            .targetEvent(ev)
        );
    };
});


//Passes view information around the place
app.service('appPageService', function() {

    this.pageID = 'project';

});

//Passes user data around the place
app.service('userDataService', function($http, $log) {

    var userDataService = {};

    userDataService.dmp = {
        //Define project
        //dmpCreatedDate should be populated automagically
        //lastUpdateDate should be populated automagically
        //lastAccessDate should be populated automagically
        //If endDate is empty, project is ongoing
        project: {
            title: "",
            description: "",
            fieldOfResearch: [],
            dmpCreatedDate: new Date(),
            lastUpdateDate: new Date(),
            lastAccessDate: new Date(),
            startDate: new Date(),
            endDate: null
        },
        contributors: [new Contributor(0)],
        policies: {
            relatedPolicies: ""
        },
        funding: {
            funder: "",
            funderID: "",
            researchOfficeID: ""
        },
        ethics: {
            required: "",
            manageEthics: "",
            managePrivacy: ""
        }
    };

    //TODO: Will need to be changed to support loading.
    userDataService.nextContributorID = 1;

    //A class for contributors
    function Contributor(id) {
        this.id = id;
        this.firstname = id;
        this.affiliation = "";
        this.email = "";
        this.username = "";
        this.orcid = "";
    }

    //Adds a contributor to the DMP
    userDataService.addContributor = function() {
        var newContributor = new Contributor(userDataService.nextContributorID);
        userDataService.nextContributorID++;
        userDataService.dmp.contributors.push(newContributor);
    };

    //Deletes a contributor by id.
    userDataService.deleteContributor = function(id) {
        for (i = userDataService.dmp.contributors.length - 1; i >= 0; i--) {
            if (userDataService.dmp.contributors[i].id == id) {
                userDataService.dmp.contributors.splice(i, 1);
            }
        }
    };

    //Saves DMP data to the server
    userDataService.save = function() {
        userDataService.dmp.project.lastUpdateDate = new Date();
        $http({
            method: "POST",
            url: "php/receiver.php",
            data: userDataService.dmp
        }).then(function mySuccess(response) {
            userDataService.postStatus = response.data;
        }, function myError(response) {
            userDataService.postStatus = response.statusText;
        });
    };

    //Loads DMP data from the server
    userDataService.load = function() {
        return $http.get('php/dmp.json')
            .then(function mySuccess(response) {
                userDataService.getStatus = response.data;
                userDataService.dmp = userDataService.getStatus;
                userDataService.dmp.project.dmpCreatedDate = new Date(userDataService.dmp.project.dmpCreatedDate);
                userDataService.dmp.project.lastUpdateDate = new Date(userDataService.dmp.project.lastUpdateDate);
                userDataService.dmp.project.lastAccessDate = new Date();
                userDataService.dmp.project.startDate = new Date(userDataService.dmp.project.startDate);
                if ((userDataService.dmp.project.endDate !== '') && (userDataService.dmp.project.endDate !== null)) {
                    userDataService.dmp.project.endDate = new Date(userDataService.dmp.project.endDate);
                }
            }, function myError(response) {
                userDataService.getStatus = response.statusText;
            });
    };
    return userDataService;

});

//Loads help text and labels etc.
app.service('helpTextService', function($http) {

    var helpTextService = {};

    helpTextService.loadHelpText = function() {
        return $http.get('text/dmpHelpText.json');
    };

    return helpTextService;

});

//Loads field of research data from JSON
app.service('fieldOfResearchService', function($http) {

    var fieldOfResearchService = {};

    //Field of research search thingy.
    fieldOfResearchService.selectedItem = null;
    fieldOfResearchService.searchText = null;
    fieldOfResearchService.selectedFORs = [];

    /**
     * Return the proper object when the append is called.
     */
    fieldOfResearchService.transformChip = function(chip) {
        // If it is an object, it's already a known chip
        if (angular.isObject(chip)) {
            return chip;
        }

        // Otherwise, create a new one
        return {
            name: chip,
            code: 'new'
        };
    };

    /**
     * Search for fieldOfResearchs.
     */
    fieldOfResearchService.querySearch = function(query) {
        var results = query ? fieldOfResearchService.fieldOfResearchArray.filter(fieldOfResearchService.createFilterFor(query)) : [];
        return results;
    };

    /**
     * Create filter function for a query string
     */
    fieldOfResearchService.createFilterFor = function(query) {
        var lowercaseQuery = angular.lowercase(query);

        return function filterFn(fieldOfResearch) {
            return (fieldOfResearch._lowername.indexOf(lowercaseQuery) !== -1) ||
                (fieldOfResearch.code.indexOf(lowercaseQuery) !== -1);
        };

    };

    //Load fields of research from json
    fieldOfResearchService.loadFieldOfResearchArray = function() {
        $http.get('text\\fieldOfResearch_flat.json')
            .then(function mySuccess(response) {
                fieldOfResearchService.fieldOfResearchArray = response.data;
                fieldOfResearchService.fieldOfResearchArray.map(function(fieldOfResearch) {
                    fieldOfResearch._lowername = fieldOfResearch.name.toLowerCase();
                    return fieldOfResearch;
                });
            }, function myError(response) {
                fieldOfResearchService.fieldOfResearchArray = null;
            });
    };


    return fieldOfResearchService;

});

//ORCID stuff
var oauthWindow;

function openORCID() {
    var oauthWindow = window.open("https://sandbox.orcid.org/oauth   /authorize?client_id=0000-0002-1223-3173&response_type=code&scope=/authenticate&redirect_uri=http://localhost:8080/oauth-redirect.html", "_blank", "toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500");
}
