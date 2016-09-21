var app = angular.module('dmpOnlineTool', ['ngMaterial', 'ngMessages']);

app.controller('formCtrl', function($scope, userDataService, helpTextService) {
    $scope.userDataService = userDataService;

    $scope.userDataService.load();


    $scope.helpTextService = helpTextService;
    $scope.helpTextService.loadHelpText();


});


//A directive to make input areas, and hopefully automagically get helper text from json
app.directive("dmpTextBox", function($log, $compile, helpTextService) {

    return {
        require: "?ngModel",

        scope: true,

        link: function(scope, element, attrs, ngModel) {
            if (!ngModel) return;

            //Initialise help labels and such
            function init() {
                scope.helpTextService = helpTextService;
                scope.helpTextService.promise.then(function() {
                    scope.helpFields = scope.helpTextService.getFieldRef(attrs.ngModel);

                    //Format tags from html
                    var containerTags = attrs.hasOwnProperty('containertags') ? attrs.containertags : "";
                    var inputTags = attrs.hasOwnProperty('inputtags') ? attrs.inputtags : "";
                    var label = (scope.helpFields.hasOwnProperty('label') && scope.helpFields.label !== "") ? scope.helpFields.label : "";
                    var labelTags = (label !== "") ? ("<label>" + scope.helpFields.label + "</label>") : "";
                    var labelAria = (label !== "") ? (" aria-label=" + scope.helpFields.label) : "";
                    var placeholder = (scope.helpFields.hasOwnProperty('placeholder') && scope.helpFields.placeholder !== "") ? ("placeholder=" + scope.helpFields.placeholder) : "";
                    var tooltip = (scope.helpFields.hasOwnProperty('tooltip') && scope.helpFields.tooltip !== "") ? ("<md-tooltip>" + scope.helpFields.tooltip + "</md-tooltip>") : "";

                    //Create input HTML
                    var template = '<md-input-container layout="row"' + containerTags + '>' +
                        labelTags +
                        '<input ' + placeholder + " ng-model='value' ng-change='onChange()'" + inputTags + labelAria + ">" +
                        tooltip +
                        '</md-input-container>';

                    //Compile the HTML, and add to DOM
                    var linkFn = $compile(template);
                    var content = linkFn(scope);
                    element.append(content);
                });
            }

            init();

            scope.onChange = function() {
                ngModel.$setViewValue(scope.value);
            };

            ngModel.$render = function() {
                scope.value = ngModel.$modelValue;
            };
        }
    };
});

app.config(function($mdThemingProvider) {
    var customBlueMap = $mdThemingProvider.extendPalette('light-blue', {
        'contrastDefaultColor': 'light',
        'contrastDarkColors': ['50'],
        '50': 'ffffff'
    });
    $mdThemingProvider.definePalette('customBlue', customBlueMap);
    $mdThemingProvider.theme('default')
        .primaryPalette('customBlue', {
            'default': '900',
            'hue-1': '50'
        })
        .accentPalette('pink');
    $mdThemingProvider.theme('input', 'default')
        .primaryPalette('grey');
});

//Passes user data around the place
app.service('userDataService', function($http, $log) {

    var userDataService = {};

    userDataService.dmp = DMP(0);

    //A class for DMPs
    function DMP(id) {
        this.id = id;
        this.dmpCreatedDate = new Date();
        this.lastUpdateDate = new Date();
        this.lastAccessDate = new Date();
        this.startDate = new Date();
        this.endDate = {
            title: "",
            description: "",
            fieldOfResearch: []
        };

        this.contributors = [];

        this.funders = [];

        this.ethics = {
            required: "",
            ethicsDocuments: []
        };

        this.dataAssets = [];
    }

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

    //A class for ethics documents
    function EthicsDocument(id) {
        this.id = id;
        this.description = "";
        this.link = "";
    }

    //A class for funders
    function Funder(id) {
        this.id = id;
        this.agency = "";
        this.funderID = "";
        this.researchOfficeID = "";
    }

    //A class for data assets
    function DataAsset(id) {
        this.id = id;
        this.description = "";
        this.collectionProcess = "";
        this.organisationProcess = "";
        this.storageProcess = "";
        this.metadataRequirements = "";
        this.copyrightOwner = "";
        this.accessControl = {};
        this.retention = {};
        this.publicationProcess = "";
        this.license = {};
        this.archiving = "";
        this.dataContact = {};
        this.issues = [];
        this.policyRequirements = [];
    }

    //A class for access controller
    function AccessControl() {
        this.status = "";
        this.retainUntil = "";
    }

    //A class for access controller
    function Retention() {
        this.retentionType = "";
        this.details = "";
        this.releaseDate = "";
        this.complianceProcess = "";
    }

    //A class for licenses
    function License() {
        this.name = "";
        this.logo = "";
    }

    //A class for ethical, privacy, cultural issues
    function Issue() {
        this.id = "";
        this.type = "";
        this.description = "";
        this.managementProcess = "";
    }

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
                //Convert dates from string
                userDataService.dmp.projectDetails.dmpCreatedDate = new Date(userDataService.dmp.projectDetails.dmpCreatedDate);
                userDataService.dmp.projectDetails.lastUpdateDate = new Date(userDataService.dmp.projectDetails.lastUpdateDate);
                userDataService.dmp.projectDetails.lastAccessDate = new Date();
                userDataService.dmp.projectDetails.startDate = new Date(userDataService.dmp.projectDetails.startDate);
                if ((userDataService.dmp.projectDetails.endDate !== '') && (userDataService.dmp.projectDetails.endDate !== null)) {
                    userDataService.dmp.projectDetails.endDate = new Date(userDataService.dmp.projectDetails.endDate);
                }
                //Set next contributor ID
                userDataService.nextContributorID = userDataService.dmp.contributors.length;
            }, function myError(response) {
                userDataService.getStatus = response.statusText;
            });
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
        //Remove references to userDataService.dmp if they exist.
        path = path.replace(/^(userDataService\.dmp\.)/, "");
        return deep_value(helpTextService.dmpHelpText, path);
    };

    return helpTextService;

});


function DialogController($scope, $mdDialog) {
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}


function DialogController($scope, $mdDialog) {
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}

//From stack exchange, gets nested fields from string
deep_value = function(obj, path) {
    for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
        obj = obj[path[i]];
    }
    return obj;
};
