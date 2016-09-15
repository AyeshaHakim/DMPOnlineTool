/*jshint esversion: 6 */

var app = angular.module('dmpOnlineTool', ['ngMaterial', 'ngMessages']);


app.controller('formCtrl', function($scope, $http, $log, $rootScope, $mdDialog, appPageService, userDataService, helpTextService, fieldOfResearchService) {

    $scope.appPageService = appPageService;
    $scope.userDataService = userDataService;

    $scope.helpTextService = helpTextService;
    $scope.helpTextService.loadHelpText();


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

//Control an input field, its help text, and such. Also get link to model for that
//data in userDataService (so it requires the two to be the same!)
app.controller('inputCtrl', function($scope, $timeout, $mdDialog, $log, helpTextService, userDataService) {
    $scope.helpTextService = helpTextService;
    $scope.userDataService = userDataService;

    $scope.helpProperties = {
        "label": "",
        "defaultText": "",
        "helpBoxText": "",
        "tooltip": "",
        "options": [],
        "autocomplete": []
    };

    //Takes the fields JSON reference as an argument e.g. showHelpButton("project.title")
    $scope.init = function(jsonRef) {
        $scope.jsonRef = jsonRef;

        //Needs to wait until help text is loaded, hence the promise.
        $scope.helpTextService.promise.then(function() {
            //Get help text JSON
            var helpPropertiesFromJSON = $scope.helpTextService.getFieldRef($scope.jsonRef);
            //Merge with default values
            $scope.helpProperties = merge($scope.helpProperties, helpPropertiesFromJSON);
            // if ($scope.helpProperties.defaultText === "") {
            //     $scope.helpProperties.defaultText=undefined;
            // }
        });
    };

    //ev is the dom click event to control the animation.
    $scope.helpBox = function(ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        // Modal dialogs should fully cover application
        // to prevent interaction outside of dialog
        $timeout.cancel($scope.hide);
        $mdDialog.show(
            $mdDialog.alert()
            .parent(angular.element(document.querySelector('#popupContainer')))
            .clickOutsideToClose(true)
            .title($scope.helpProperties.label)
            .textContent($scope.helpProperties.helpBoxText)
            .ariaLabel('Help box')
            .ok('Got it!')
            .targetEvent(ev)
        );
    };

    //Autocomplete functions.
    //Search for fieldOfResearchs.
    $scope.querySearch = function(query) {
        var results = query ? $scope.helpProperties.autocomplete.filter($scope.createFilterFor(query)) : [];
        return results;
    };

    /**
     * Create filter function for a query string
     */
    $scope.createFilterFor = function(query) {
        var lowercaseQuery = angular.lowercase(query);

        return function filterFn(match) {
            return (match._lowername.indexOf(lowercaseQuery) !== -1) ||
                (match.code.indexOf(lowercaseQuery) !== -1);
        };

    };


    //Merge objects from http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
    //Slightly modified to ignore empty values (i.e. retain default if JSON is empty)
    var merge = function() {
        var obj = {},
            i = 0,
            il = arguments.length,
            key;
        for (; i < il; i++) {
            for (key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key) && (arguments[i][key] !== "")  && (arguments[i][key] !== {})) {
                    obj[key] = arguments[i][key];
                }
            }
        }
        return obj;
    };


});

//Passes view information around the place
app.service('appPageService', function() {

    this.pageID = 'contributors';

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
        policies: [new Policy(0)],
        funding: [new Funder(0)],
        ethics: {
            required: "",
            manageEthics: "",
            managePrivacy: ""
        }
    };

    userDataService.nextContributorID = 1;

    //A class for contributors
    function Contributor(id) {
        this.id = id;
        this.firstname = "";
        this.lastname = "";
        this.role = "";
        this.affiliation = "";
        this.email = "";
        this.username = "";
        this.orcid = "";
    }

    //A class for policies
    function Policy(id) {
        this.id = id;
        this.name = "";
        this.description = "";
    }

    //A class for funders
    function Funder(id) {
        this.id = id;
        this.agency = "";
        this.funderID = "";
        this.researchOfficeID = "";
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
                //Set next contributor ID
                userDataService.nextContributorID = userDataService.dmp.contributors.length;
            }, function myError(response) {
                userDataService.getStatus = response.statusText;
            });
    };

    //Gets a reference to a help text field associated with a JSON string (e.g. 'project.title')
    userDataService.getDataModelRef = function(path) {
        return userDataService.deep_value(userDataService.dmp, path);
    };

    //From stack exchange, gets nested fields from string
    userDataService.deep_value = function(obj, path) {
        $log.debug(obj);
        $log.debug(path);
        for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
            obj = obj[path[i]];
        }
        return obj;
    };

    return userDataService;

});

//Loads help text and labels etc.
//I might try and get this to control visibility of help buttons. Seems inordinate,
//but I'm not very good at this.
app.service('helpTextService', function($http, $log) {


    var helpTextService = {};
    helpTextService.helpLocation = 'text/dmpHelpText.json';
    helpTextService.dmpHelpText = {};

    helpTextService.loadHelpText = function() {
        helpTextService.promise = $http.get(helpTextService.helpLocation);
        helpTextService.promise.then(function(response) {
            helpTextService.dmpHelpText = response.data.dmpHelpText;
        });
    };

    //Gets a reference to a help text field associated with a JSON string (e.g. 'project.title')
    helpTextService.getFieldRef = function(path) {
        return helpTextService.deep_value(helpTextService.dmpHelpText, path);
    };

    //From stack exchange, gets nested fields from string
    helpTextService.deep_value = function(obj, path) {
        for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
            obj = obj[path[i]];
        }
        return obj;
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
