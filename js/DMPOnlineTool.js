var app = angular.module('dmpOnlineTool', ['ngMaterial', 'ngMessages']);

app.controller('formCtrl', function($log, $scope, $mdDialog, $timeout, userDataService, helpTextService, fieldOfResearchService) {
    $scope.userDataService = userDataService;
    $scope.userDataService.load();

    $scope.fieldOfResearchService = fieldOfResearchService;
    fieldOfResearchService.loadFieldOfResearchArray();

    $scope.helpTextService = helpTextService;
    $scope.helpTextService.loadHelpText();

    //ev is the dom click event to control the animation.
    $scope.helpBox = function(ev, title, helpBoxText) {
        // Appending dialog to document.body to cover sidenav in docs app
        // Modal dialogs should fully cover application
        // to prevent interaction outside of dialog
        $timeout.cancel($scope.hide);
        $mdDialog.show(
            $mdDialog.alert()
            .parent(angular.element(document.querySelector('#popupContainer')))
            .clickOutsideToClose(true)
            .title(title)
            .textContent(helpBoxText)
            .ariaLabel('Help box')
            .ok('Got it!')
            .targetEvent(ev)
        );
        // $log.debug('hollaa');

    };


});


//A directive to make input areas, and hopefully automagically get helper text from json
//Leading and trailing spaces are automagically inserted
app.directive("dmpInput", function($log, $compile, helpTextService) {

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
                    var inputType = attrs.hasOwnProperty('inputtype') ? (attrs.inputtype + " ") : "input ";

                    //Attributes inserted in md-input-container start tag
                    var containerTags = attrs.hasOwnProperty('containertags') ? (attrs.containertags + " ") : "";
                    //Attributes inserted in input start tag
                    var inputTags = attrs.hasOwnProperty('inputtags') ? (attrs.inputtags + " ") : "";
                    //Text inserted between input start and end tags
                    var inputContent = attrs.hasOwnProperty('inputcontent') ? (attrs.inputcontent + " ") : "";

                    var label = (scope.helpFields.hasOwnProperty('label') && scope.helpFields.label !== "") ? escapeRegExp(scope.helpFields.label) : "";
                    var labelTags = (label !== "") ? ("<label>" + scope.helpFields.label + "</label>") : "";
                    var labelAria = (label !== "") ? ("aria-label='" + scope.helpFields.label + "' ") : "";

                    var helpBox = (scope.helpFields.hasOwnProperty('helpBoxText') && scope.helpFields.helpBoxText !== "") ? ("ng-dblclick=\"helpBox($event,'" + label + "','" + escapeRegExp(scope.helpFields.helpBoxText) + "')\" ") : "";
                    var placeholder = (scope.helpFields.hasOwnProperty('placeholder') && scope.helpFields.placeholder !== "") ? ("placeholder='" + escapeRegExp(scope.helpFields.placeholder) + "' ") : "";
                    var tooltip = (scope.helpFields.hasOwnProperty('tooltip') && scope.helpFields.tooltip !== "") ? ("<md-tooltip>" + escapeRegExp(scope.helpFields.tooltip) + "</md-tooltip>") : "";

                    //Create input HTML
                    var template = '<md-input-container layout="row" ' + containerTags + helpBox + '>' +
                        labelTags +
                        '<' + inputType + placeholder + "ng-model='value' ng-change='onChange()' " + inputTags + labelAria + ">" + inputContent + "</" + inputType + ">" +
                        tooltip +
                        '</md-input-container>';

                    //Compile to HTML, and add to DOM
                    // $log.debug(template);
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

//A directive to display a contributor as a card.
//Also allows display of a "Add new" card.
app.directive("dmpCard", function($log, $compile, helpTextService) {

    return {
        restrict: 'E',

        require: "?ngModel",

        scope: {
            ngModel: '='
        },

        template: function(element, attrs) {
            var type = attrs.type || 'contributor';
            $log.debug(type);
            // var required = attrs.hasOwnProperty('required') ? "required='required'" : "";
            // for (var i = 0; i < cars.length; i++) {
            //     text += cars[i] + "<br>";
            // }
            var htmlText = "";
            //Bits of the card
            var cardTags = "class='card'";
            var heading = "";
            var subheading = "";
            var contentTags = "";
            var content = "";
            var buttons = "";

            if (type === 'contributor') {
                heading = "{{ngModel.firstname}} {{ngModel.lastname}}";
                subheading = "{{ngModel.affiliation}}";
                content = "<em>{{ngModel.role.join(', ')}}</em>" +
                    "<div class='md-subhead'>{{ngModel.email}}</div>";
                buttons = "<md-button class=\"elevated\">Edit</md-button>" +
                    "<md-button class=\"elevated\">Remove</md-button>";
            } else if (type === 'addnewcontributor') {
                cardTags = "class='card addcard'";
                heading = "Add new contributor...";
                contentTags = "class='center'";
                content = "<md-icon md-svg-icon=\"account-plus\" class=\"icon-120px lift-icon flip-horizontal\"></md-icon>";
            } else if (type === 'dataasset') {
                heading = "{{ngModel.shortname}}";
                content = "<div class='md-subhead'>{{ngModel.description}}</div>" +
                    "<div class='smaller-text80'>" +
                    "<p><em>Collection: </em><br>" +
                    "{{ngModel.collectionProcess}}</p>" +
                    "<p><em>Organisation: </em><br>" +
                    "{{ngModel.organisationProcess}}</p>" +
                    "<p><em>Storage: </em><br>" +
                    "{{ngModel.storageProcess}}</p>" +
                    "<p><em>Metadata: </em><br>" +
                    "{{ngModel.metadataRequirements}}</p>" +
                    "<p><em>Copyright owner: </em><br>" +
                    "{{ngModel.copyrightOwner}}</p>" +
                    "<p><em>Publication process: </em><br>" +
                    "{{ngModel.publicationProcess}}</p>" +
                    "<p><em>Archiving requirements: </em><br>" +
                    "{{ngModel.archiving}}</p>" +
                    "<p><em>Resource requirements: </em><br>" +
                    "{{ngModel.requiredResources}}</p>" +
                    "</div>";
                buttons = "<md-button class=\"elevated\">Edit</md-button>" +
                    "<md-button class=\"elevated\">Remove</md-button>";
            } else if (type === 'addnewdataasset') {
                cardTags = "class='card addcard'";
                heading = "Add new data asset...";
                contentTags = "class='center'";
                content = "<md-icon md-svg-icon=\"database-plus\" class=\"icon-150px lift-icon\"></md-icon>";
            } else if (type === 'funder') {
                heading = "<div class='smaller-text80'>{{ngModel.funder}}</div>";
                subheading = "{{ngModel.affiliation}}";
                content = "<span class='md-subhead'>Reference numbers: </span>" +
                    "<div><em>Funder: </em>{{ngModel.funderID}}</div>" +
                    "<div><em>Research office: </em>{{ngModel.researchOfficeID}}</div>";
                buttons = "<md-button class=\"elevated\">Edit</md-button>" +
                    "<md-button class=\"elevated\">Remove</md-button>";
            } else if (type === 'addnewfunder') {
                cardTags = "class='card addcard'";
                heading = "<div class='smaller-text80'>Add new funder...</div>";
                contentTags = "class='center'";
                content = "<div class='right-offset-icon'><md-icon md-svg-icon=\"bank\" class=\"icon-90px lift-icon\"></md-icon>" +
                    "<md-icon md-svg-icon=\"plus\" class=\"supplementary-plus lift-icon\"></md-icon></div>";
            } else if (type === 'document') {
                heading = "<span class='smaller-text80'>{{ngModel.shortname}}</span>";
                content = "<div class='md-subhead'>{{ngModel.description}}</div>" +
                    "<div class='center'><md-button class=\"md-raised md-primary elevated\"><md-icon md-svg-icon=\"book\"></md-icon>  View Document</md-button></div>";
                buttons = "<md-button class=\"elevated\">Edit</md-button>" +
                    "<md-button class=\"elevated\">Remove</md-button>";
            } else if (type === 'addnewdocument') {
                cardTags = "class='card addcard'";
                heading = "<div class='smaller-text80'>Attach new document...</div>";
                contentTags = "class='center'";
                content = "<md-icon md-svg-icon=\"book-plus\" class=\"icon-90px\"></md-icon>";
            }

            //Compile optional stuff
            buttons = (buttons !== "") ? ("<md-card-actions layout=\"row\" layout-align=\"end center\">" + buttons + "</md-card-actions>") : "";
            subheading = (subheading !== "") ? ("<span class='md-subhead raised-subhead'>" + subheading + "</span>") : "";

            //Create card
            htmlText =
                "<md-card" + addLeadingSpace(cardTags) + ">" +
                "<md-card-title>" +
                "<md-card-title-text>" +
                "<span class='md-headline'>" +
                heading +
                "</span>" +
                subheading +
                "</md-card-title-text>" +
                "</md-card-title>" +
                "<md-card-content" + addLeadingSpace(contentTags) + ">" +
                content +
                "</md-card-content>" +
                buttons +
                "</md-card>";


            $log.debug('html');
            $log.debug(htmlText);
            return htmlText;
        },

        link: function(scope, element, attrs, ngModel) {
            if (!ngModel) return;

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

//Include MDI (icons)
app.config(function($mdIconProvider) {
    $mdIconProvider
        .defaultIconSet('icons/mdi.svg');
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

//Loads field of research data from JSON
app.service('fieldOfResearchService', function($http) {

    var fieldOfResearchService = {};

    //Field of research search thingy.
    fieldOfResearchService.selectedItem = null;
    fieldOfResearchService.searchText = null;
    fieldOfResearchService.selectedFORs = [];

    //Text to insert between input tags for autocomplete functionality.
    fieldOfResearchService.autocompleteText = "<md-autocomplete " +
        "md-selected-item=\"fieldOfResearchService.selectedItem\" " +
        "md-search-text=\"fieldOfResearchService.searchText\" " +
        "md-items=\"item in fieldOfResearchService.querySearch(fieldOfResearchService.searchText)\" " +
        "md-item-text=\"item.name\">" +
        // "placeholder=\"{{helpProperties.defaultText}}\">" +
        "<span md-highlight-text=\"fieldOfResearchService.searchText\">{{item.name}}</span></md-autocomplete>" +
        "<md-chip-template>" +
        "<span>" +
        "<strong>{{$chip.name}} </strong>" +
        "<em>({{$chip.code}})</em>" +
        "</span>" +
        "</md-chip-template>";

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

//http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(str) {
    return str.replace(/[\'\"]/g, "\\$&");
}

function addLeadingSpace(str) {
    return (str === "") ? "" : (" " + str);
}

//From stack exchange, gets nested fields from string
deep_value = function(obj, path) {
    for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
        obj = obj[path[i]];
    }
    return obj;
};
