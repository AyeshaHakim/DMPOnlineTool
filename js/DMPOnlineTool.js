/*jshint esversion: 6 */

var app = angular.module('dmpOnlineTool', ['ngMaterial', 'ngMessages']);

app.controller('formCtrl', function($log, $scope, $mdDialog, $timeout, userDataService, helpTextService, fieldOfResearchService, cardVisibilityService) {

    $scope.userDataService = userDataService;
    $scope.userDataService.load();

    $scope.cardVisibilityService = cardVisibilityService;

    $scope.fieldOfResearchService = fieldOfResearchService;
    fieldOfResearchService.loadFieldOfResearchArray();

    $scope.helpTextService = helpTextService;
    $scope.helpTextService.loadHelpText();


    //Confirmation dialog for overwriting a card. Confirmation is only presented
    //if overwriting a card
    $scope.confirmSaveScratchChanges = function(ev, field, index) {
        //TODO: Check required fields here??????????
        if (!userDataService.scratchHasExtraCard(field) && userDataService.hasUnsavedChanges(field)) {
            $mdDialog.show({
                    controller: DialogController,
                    template: '<md-dialog aria-label="Confirm save">' +
                        '  <md-toolbar class="dialog-header">' +
                        'Do you want to overwrite this ' + $scope.helpTextService.getFieldRef(field).label.toLowerCase() + '?' +
                        '  </md-toolbar>' +
                        '  <md-dialog-content class="dialog-padding">' +
                        '    <dmp-card scratch=false readonly=true cardindex=' + cardVisibilityService[field].detailsCardIndex + ' type="' + field + '"></dmp-card>' +
                        '  </md-dialog-content>' +
                        '<md-dialog-actions layout="row">' +
                        '<md-button ng-click="confirm()">' +
                        'Confirm' +
                        '</md-button>' +
                        '<md-button ng-click="cancel()" md-autofocus>' +
                        'Cancel' +
                        '</md-button>' +
                        '</md-dialog-actions>' +
                        '</form>' +
                        '</md-dialog>',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                })
                .then(function(confirm) {
                    $scope.saveScratchChanges(field);
                }, function() {});
        } else {
            $scope.saveScratchChanges(field);
        }
    };

    //Asks for confirmation to close a card if it contains unsaved changes.
    $scope.confirmCancelScratchChanges = function(ev, field, switchToCardIndex = undefined) {
        if (userDataService.hasUnsavedChanges(field)) {
            $mdDialog.show({
                    controller: DialogController,
                    template: '<md-dialog aria-label="Confirm close">' +
                        '  <md-toolbar class="dialog-header">' +
                        'Discard changes to this ' + $scope.helpTextService.getFieldRef(field).label.toLowerCase() + '?' +
                        '  </md-toolbar>' +
                        '  <md-dialog-content class="dialog-padding">' +
                        '    <dmp-card scratch=true readonly=true cardindex=' + cardVisibilityService[field].detailsCardIndex + ' type="' + field + '"></dmp-card>' +
                        '  </md-dialog-content>' +
                        '<md-dialog-actions layout="row">' +
                        '<md-button ng-click="confirm()">' +
                        'Confirm' +
                        '</md-button>' +
                        '<md-button ng-click="cancel()" md-autofocus>' +
                        'Cancel' +
                        '</md-button>' +
                        '</md-dialog-actions>' +
                        '</form>' +
                        '</md-dialog>',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                })
                .then(function(confirm) {
                    $scope.cancelScratchChanges(field, switchToCardIndex);
                }, function() {});
        } else {
            $scope.cancelScratchChanges(field, switchToCardIndex);
        }
    };

    //Confirmation dialog for deleting a card,
    $scope.confirmDeleteScratchCard = function(ev, field, index) {
        $mdDialog.show({
                controller: DialogController,
                template: '<md-dialog aria-label="Confirm delete">' +
                    '  <md-toolbar class="dialog-header">' +
                    'Do you want to delete this ' + $scope.helpTextService.getFieldRef(field).label.toLowerCase() + '?' +
                    '  </md-toolbar>' +
                    '  <md-dialog-content class="dialog-padding">' +
                    '    <dmp-card scratch=true readonly=true cardindex=' + cardVisibilityService[field].detailsCardIndex + ' type="' + field + '"></dmp-card>' +
                    '  </md-dialog-content>' +
                    '<md-dialog-actions layout="row">' +
                    '<md-button ng-click="confirm()">' +
                    'Confirm' +
                    '</md-button>' +
                    '<md-button ng-click="cancel()" md-autofocus>' +
                    'Cancel' +
                    '</md-button>' +
                    '</md-dialog-actions>' +
                    '</form>' +
                    '</md-dialog>',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
            })
            .then(function(confirm) {
                $scope.deleteScratchCard(field, index);
            }, function() {});
    };


    function DialogController($scope, $mdDialog, userDataService, cardVisibilityService) {
        $scope.cardVisibilityService = cardVisibilityService;
        $scope.userDataService = userDataService;
        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.confirm = function(confirm) {
            $mdDialog.hide(confirm);
        };
    }

    $scope.newScratchCard = function(field) {
        var n = userDataService.newScratchCard(field);
        return n;
    };

    //Save a card, if index is omitted the whole field will be saved.
    $scope.saveScratchChanges = function(field) {
        userDataService.scratchToDMP(field);
        cardVisibilityService[field].detailsCardIndex = userDataService.getNewCardIndex(field, cardVisibilityService[field].detailsCardIndex);
        cardVisibilityService[field].addCardVisible = true;
    };

    //Cancel all changes, can swtich to a card afterwards
    $scope.cancelScratchChanges = function(field, switchToCardIndex = undefined) {
        userDataService.dmpToScratch(field);
        cardVisibilityService[field].addCardVisible = true;
        if (switchToCardIndex === undefined) {
            cardVisibilityService[field].detailsCardVisible = false;
        } else {
            $scope.switchCardToIndex(field, switchToCardIndex);
        }
    };

    //Delete a card from a first level field.
    $scope.deleteScratchCard = function(field, index) {
        userDataService.deleteScratchCard(field, index);
        userDataService.scratchToDMP(field);
        cardVisibilityService[field].detailsCardVisible = false;
    };

    //Switch details card to another entry.
    $scope.switchCardToIndex = function(field, index) {
        if (userDataService.hasUnsavedChanges(field)) {
            $log.debug('here');
            $scope.confirmCancelScratchChanges(null, field, index);
        } else {
            cardVisibilityService.switchCardToIndex(field, index);
        }
    };

    // //Create a new scratch card.
    // $scope.newScratchCard = function(field, index) {
    //     userDataService.deleteScratchCard(field, index);
    //     userDataService.scratchToDMP(field);
    //     cardVisibilityService[field].detailsCardVisible = false;
    // };

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
    };

});


//A directive to make input areas, and hopefully automagically get helper text from json
//Leading and trailing spaces are automagically inserted
app.directive("dmpInput", function($log, $compile, helpTextService, fieldOfResearchService) {
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
                    var inputType = attrs.hasOwnProperty('inputtype') ? (attrs.inputtype) : "input ";

                    //Only do this if help fields are defined in the JSON
                    if (scope.helpFields === undefined) {
                        scope.helpFields = {};
                    }


                    //Attributes inserted in md-input-container start tag
                    containerTags = attrs.hasOwnProperty('containertags') ? (attrs.containertags) : "";
                    //Attributes inserted in input start tag
                    inputTags = attrs.hasOwnProperty('inputtags') ? (attrs.inputtags) : "";
                    //Text inserted between input start and end tags
                    inputContent = attrs.hasOwnProperty('inputcontent') ? (attrs.inputcontent) : "";

                    var label = (scope.helpFields.hasOwnProperty('label') && scope.helpFields.label !== "") ? escapeRegExp(scope.helpFields.label) : "";
                    var labelTags = (label !== "") ? ("<label>" + scope.helpFields.label + "</label>") : "";
                    var labelAria = (label !== "") ? ("aria-label='" + scope.helpFields.label + "'") : "";

                    var helpBox = (scope.helpFields.hasOwnProperty('helpBoxText') && scope.helpFields.helpBoxText !== "") ? ("ng-dblclick=\"helpBox($event,'" + label + "','" + escapeRegExp(scope.helpFields.helpBoxText) + "')\" ") : "";
                    var placeholder = (scope.helpFields.hasOwnProperty('placeholder') && scope.helpFields.placeholder !== "") ? ("placeholder='" + escapeRegExp(scope.helpFields.placeholder) + "'") : "";
                    var tooltip = (scope.helpFields.hasOwnProperty('tooltip') && scope.helpFields.tooltip !== "") ? ("<md-tooltip>" + escapeRegExp(scope.helpFields.tooltip) + "</md-tooltip>") : "";
                    var required = (scope.helpFields.hasOwnProperty('required') && scope.helpFields.required) ? ('ng-required="true"') : "";

                    //Label is placed where input content should be for checkboxes.
                    if (inputType === "md-checkbox") {
                        inputContent = label;
                        labelTags = "";
                    } else if (inputType === "md-chips") {
                        scope.fieldOfResearchService = fieldOfResearchService;
                        //Text to insert between input tags for autocomplete functionality.
                        inputContent = fieldOfResearchService.getAutoCompleteInsert(placeholder);

                    }

                    //Create input HTML
                    var template = '<md-input-container layout="row"' + addLeadingSpace(containerTags) + addLeadingSpace(helpBox) + '>' +
                        labelTags +
                        '<' + inputType + addLeadingSpace(placeholder) + addLeadingSpace(required) + " ng-model='value' ng-change='onChange()'" + addLeadingSpace(inputTags) + addLeadingSpace(labelAria) + ">" + inputContent + "</" + inputType + ">" +
                        tooltip +
                        '</md-input-container>';

                    //Compile to HTML, and add to DOM
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

//A directive to display a bit of the DMP as a card.
//Also allows display of a "Add new" card.
app.directive("dmpCard", function($log, $compile, cardVisibilityService, userDataService) {

    return {
        require: "?ngModel",

        scope: true,

        link: function(scope, element, attrs, ngModel) {
            var type = attrs.type || 'contributor';

            //Sets whether to display from scratch or saved data
            var scratch = attrs.scratch || "false";
            scratch = (scratch == 'true');
            if (scratch) {
                scratchString = ".scratch";
            } else {
                scratchString = "";
            }

            //Sets whether the card is an addnew one, or a details one.
            var addnew = attrs.addnew || "false";
            addnew = (addnew == 'true');

            var cardIndex = attrs.cardindex;

            var htmlText = "";
            //If card is readonly, no hover animation
            var cardTags = (attrs.readonly) ? "class='card dialog-minicard'" : "class='hoverable card minicard'";
            //Bits of the card
            var heading = "";
            var subheading = "";
            var contentTags = "";
            var cardContent = "";
            var buttons = "";
            var ngclick = "";
            var ngshow = "";
            var nghide = "";
            var ngclass = "";


            var modelString = "userDataService" + scratchString + ".dmp." + type + "[" + cardIndex + "]";

            switch (type) {
                case "contributor":
                    if (addnew) {
                        heading = "Add new contributor...";
                        contentTags = "class='center'";
                        cardContent = "<md-icon md-svg-icon=\"account-plus\" class=\"icon-120px lift-icon flip-horizontal\"></md-icon>";

                    } else {
                        heading = "{{" + modelString + ".firstname}} {{" + modelString + ".lastname}}";
                        subheading = "{{" + modelString + ".affiliation}}";
                        cardContent = "<em>{{" + modelString + ".role.join(', ')}}</em>" +
                            "<div class='md-subhead'>{{" + modelString + ".email}}</div>";
                    }
                    break;
                case "document":
                    if (addnew) {
                        heading = "<div class='smaller-text80'>Add new document...</div>";
                        contentTags = "class='center'";
                        cardContent = "<md-icon md-svg-icon=\"book-plus\" class=\"icon-90px\"></md-icon>";
                    } else {
                        heading = "<span class='smaller-text80'>{{userDataService" + scratchString + ".dmp." + type + "[" + cardIndex + "].shortname}}</span>";
                        cardContent = "<div class='md-subhead'>{{userDataService" + scratchString + ".dmp." + type + "[" + cardIndex + "].description}}</div>" +
                            "<div class='center'><md-button class=\"md-raised md-primary elevated\"><md-icon md-svg-icon=\"book\"></md-icon>  View Document</md-button></div>";
                    }
                    break;
                case "funder":
                    if (addnew) {

                    } else {

                    }
                    heading = "<div class='smaller-text80'>{{ngModel.funder}}</div>";
                    subheading = "{{ngModel.affiliation}}";
                    cardContent = "<span class='md-subhead'>Reference numbers: </span>" +
                        "<div><em>Funder: </em>{{ngModel.funderID}}</div>" +
                        "<div><em>Research office: </em>{{ngModel.researchOfficeID}}</div>";
                    break;
                case "addnewfunder":
                    heading = "<div class='smaller-text80'>Add new funder...</div>";
                    contentTags = "class='center'";
                    cardContent = "<div class='right-offset-icon'><md-icon md-svg-icon=\"bank\" class=\"icon-90px lift-icon\"></md-icon>" +
                        "<md-icon md-svg-icon=\"plus\" class=\"supplementary-plus lift-icon\"></md-icon></div>";
                    break;
                case "dataasset":
                    if (addnew) {

                    } else {

                    }
                    heading = "{{ngModel.shortname}}";
                    cardContent = "<div class='md-subhead'>{{ngModel.description}}</div>" +
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
                    break;
                case "addnewdataasset":
                    heading = "Add new data asset...";
                    contentTags = "class='center'";
                    cardContent = "<md-icon md-svg-icon=\"database-plus\" class=\"icon-150px lift-icon\"></md-icon>";
                    break;
            }

            //Insert common parts that differ according to addnew
            if (addnew) {
                ngclick = "switchCardToIndex('" + type + "',newScratchCard('" + type + "'));cardVisibilityService." + type + ".addCardVisible=false;";
                ngclass = "(cardVisibilityService." + type + ".addCardVisible) ? 'hoverable' : 'selectedcard'";

            } else {
                ngclick = "switchCardToIndex('" + type + "'," + cardIndex + ");cardVisibilityService." + type + ".addCardVisible=true;";
                ngclass = "(cardVisibilityService." + type + ".detailsCardVisible && cardVisibilityService." + type + ".detailsCardIndex==" + cardIndex + ") ? 'selectedcard' : 'hoverable'";
            }

            //Compile optional stuff
            buttons = (buttons !== "") ? ("<md-card-actions layout=\"row\" layout-align=\"end center\">" + buttons + "</md-card-actions>") : "";
            subheading = (subheading !== "") ? ("<span class='md-subhead raised-subhead'>" + subheading + "</span>") : "";
            ngclick = (ngclick !== "") ? ("ng-click=\"" + ngclick + "\"") : "";
            ngshow = (ngshow !== "") ? ("ng-show=\"" + ngshow + "\"") : "";
            nghide = (nghide !== "") ? ("ng-hide=\"" + nghide + "\"") : "";
            ngclass = (ngclass !== "") ? ("ng-class=\"" + ngclass + "\"") : "";

            //Create card
            htmlText =
                "<md-card" + addLeadingSpace(cardTags) + addLeadingSpace(ngshow) + addLeadingSpace(nghide) + addLeadingSpace(ngclick) + addLeadingSpace(ngclass) + ">" +
                "<md-card-title>" +
                "<md-card-title-text>" +
                "<span class='md-headline'>" +
                heading +
                "</span>" +
                subheading +
                "</md-card-title-text>" +
                "</md-card-title>" +
                "<md-card-content" + addLeadingSpace(contentTags) + ">" +
                cardContent +
                "</md-card-content>" +
                buttons +
                "</md-card>";

            // $log.debug(htmlText)

            var linkFn = $compile(htmlText);
            var content = linkFn(scope);
            element.append(content);

            //Do this jazz for two-way binding, maybe not necessary.
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


//A directive for an editable display card (hopefully).
app.directive("dmpDetailsCard", function($log, $compile, cardVisibilityService) {

    return {
        require: "?ngModel",

        scope: true,

        link: function(scope, element, attrs, ngModel) {

            var type = attrs.type || 'contributor';

            var htmlText = "";
            //Bits of the card
            var cardTags = "class='card detailscard'";
            var heading = "";
            var icon = "";
            var subheading = "";
            var contentTags = "";
            var cardContent = "";
            var buttons = "";
            var ngclick = "";
            var ngshow = "";
            var nghide = "";

            // var ngclass = '(cardVisibilityService.document.detailsCardVisible) ? "detailscard" : "detailscard-fullheight"';
            var ngclass = '';

            var modelString = "userDataService.scratch.dmp." + type + "[cardVisibilityService." + type + ".detailsCardIndex]";

            switch (type) {
                // case "contributor":
                //     ngshow = "cardVisibilityService[type].detailsCardVisible";
                //     heading = "Add new contributor...";
                //     icon = '<md-icon md-svg-icon="account"></md-icon>';
                //     subheading = "{{helpTextService.dmpHelpText.contributors.cardsubheading}}";
                //     cardContent = '<div layout="row">' +
                //         '<dmp-input ng-model="userDataService.dmp.contributors[cardVisibilityService.contributors.detailsCardIndex].firstname" flex="50"></dmp-input>' +
                //         '<dmp-input ng-model="userDataService.dmp.contributors[cardVisibilityService.contributors.detailsCardIndex].lastname" flex="50"></dmp-input><br>' +
                //         '</div>' +
                //         '<dmp-input ng-model="userDataService.dmp.contributors[cardVisibilityService.contributors.detailsCardIndex].role"></dmp-input><br>' +
                //         '<dmp-input ng-model="userDataService.dmp.contributors[cardVisibilityService.contributors.detailsCardIndex].affiliation"></dmp-input><br>' +
                //         '<dmp-input ng-model="userDataService.dmp.contributors[cardVisibilityService.contributors.detailsCardIndex].email"></dmp-input><br>' +
                //         '<div layout="row">' +
                //         '<dmp-input ng-model="userDataService.dmp.contributors[cardVisibilityService.contributors.detailsCardIndex].username" flex="40"></dmp-input><br>' +
                //         '<dmp-input ng-model="userDataService.dmp.contributors[cardVisibilityService.contributors.detailsCardIndex].orcid" flex="60"></dmp-input>' +
                //         '</div>';
                //     buttons = '<md-button ng-click="cardVisibilityService.contributors.detailsCardVisible=false">Save</md-button>' +
                //         '<md-button ng-click="cardVisibilityService.contributors.detailsCardVisible=false">Cancel</md-button>';
                //     break;
                case "document":
                    ngshow = "cardVisibilityService['" + type + "'].detailsCardVisible";
                    heading = "Add new document...";
                    icon = '<md-icon md-svg-icon="book"></md-icon>';
                    subheading = "{{helpTextService.dmpHelpText['" + type + "'].cardsubheading}}";
                    cardContent = '<dmp-input ng-model="' + modelString + '.shortname"></dmp-input><br>' +
                        '<dmp-input ng-model="' + modelString + '.summary" inputtype="textarea" inputtags="rows=\'3\'"></dmp-input><br>' +
                        '<dmp-input ng-model="' + modelString + '.link"></dmp-input><br>';
                    break;
            }


            //Some button logic, changing disabled for save/delete, and name for close/cancel
            buttons =
                '<md-button ng-disabled="!userDataService.hasUnsavedChanges(\'' + type + '\')" ' +
                'ng-click="confirmSaveScratchChanges($event,\'' + type + '\')">Save</md-button>' +
                '<md-button ' +
                'ng-click="confirmCancelScratchChanges($event,\'' + type + '\')">{{(userDataService.scratchEqualsDMP(\'' + type + '\') && userDataService.scratchDMPDifferenceIsEmptyCards(\'' + type + '\')) ? "Close" : "Cancel"}}</md-button>' +
                '<md-button ng-disabled="userDataService.scratchHasExtraCard(\'' + type + '\')" ' +
                'ng-click="confirmDeleteScratchCard($event,\'' + type + '\',cardVisibilityService.' + type + '.detailsCardIndex, userDataService.scratch.dmp.document[cardVisibilityService.document.detailsCardIndex], \'' + type + '\')">Delete</md-button>';

            //Compile optional stuff
            buttons = (buttons !== "") ? ("<md-card-actions layout=\"row\" layout-align=\"end center\">" + buttons + "</md-card-actions>") : "";
            subheading = (subheading !== "") ? ("<span class='md-subhead raised-subhead'>" + subheading + "</span>") : "";
            ngclick = (ngclick !== "") ? ("ng-click=\"" + ngclick + "\"") : "";
            ngshow = (ngshow !== "") ? ("ng-show=\"" + ngshow + "\"") : "";
            nghide = (nghide !== "") ? ("ng-hide=\"" + nghide + "\"") : "";
            icon = (icon !== "") ? ('<md-card-avatar>' + icon + '</md-card-avatar>') : "";
            ngclass = (ngclass !== "") ? ("ng-class=\"" + ngclass + "\"") : "";

            //Create card
            htmlText =
                "<md-card" + addLeadingSpace(cardTags) + addLeadingSpace(ngshow) + addLeadingSpace(nghide) + addLeadingSpace(ngclick) + addLeadingSpace(ngclass) + ">" +
                '<div class="padded-heading">' +
                '<md-card-header>' +
                icon +
                '<md-card-header-text class="md-headline">' +
                heading +
                '</md-card-header-text>' +
                '</md-card-header>' +
                "</div>" +
                // "<md-card-title-text>" +
                "<div class='card-subheading'>" +
                subheading +
                "</div>" +
                // "</md-card-title-text>" +
                "</md-card-title>" +
                "<md-card-content" + addLeadingSpace(contentTags) + ">" +
                "<form>" +
                cardContent +
                "</md-card-content>" +
                buttons +
                "</form>" +
                "</md-card>";

            // $log.debug(htmlText);
            var linkFn = $compile(htmlText);
            var content = linkFn(scope);
            element.append(content);

            //Do this jazz for two-way binding, maybe not necessary.
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

    //The user's DMP, to be synced with the server.
    userDataService.dmp = DMP(0);

    //Temporary storage, to be synced with the DMP when requested.
    userDataService.scratch = {};

    userDataService.scratch.dmp = DMP(0);

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

        this.ethicsRequired = false;
        this.culturalConsultationRequired = false;

        this.document = [];

        this.dataAssets = [];
    }

    //A class for contributors
    function Contributor(id = 0, firstname = "", lastname = "", role = [], affiliation = "", email = "", username = "", orcid = "") {
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.role = role;
        this.affiliation = affiliation;
        this.email = email;
        this.username = username;
        this.orcid = orcid;
    }

    //A class for documents
    function Document(id = 0) {
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

    //Copy scratch to the actual data object. Can be provided with a particular
    //field to copy, if not it will copy the whole thing.
    //An index can be provided to only update one array element. If index is -1,
    //a new array object will be created. If index is Infinity it will be ignored.
    userDataService.scratchToDMP = function(field = '', index = Infinity) {
        if (field === '') {
            userDataService.dmp = angular.copy(userDataService.scratch.dmp);
        } else {
            if (index === Infinity) {
                userDataService.dmp[field] = angular.copy(userDataService.scratch.dmp[field]);
            } else {
                userDataService.dmp[field][index] = angular.copy(userDataService.scratch.dmp[field][index]);
            }
        }
    };
    //Other way around, cancels changes
    userDataService.dmpToScratch = function(field = '') {
        if (field === '') {
            userDataService.scratch.dmp = angular.copy(userDataService.dmp);
        } else {
            userDataService.scratch.dmp[field] = angular.copy(userDataService.dmp[field]);
        }
    };

    //Checks whether the scratch and DMP are the same (i.e. for detecting unsaved changes)
    //Can be provided with a field and index for a more targeted approach
    userDataService.scratchEqualsDMP = function(field = '', index = Infinity) {
        if (userDataService.scratch.dmp !== undefined) {
            if (field === '') {
                return angular.equals(userDataService.scratch.dmp, userDataService.dmp);
            } else {
                if (index === Infinity) {
                    return angular.equals(userDataService.scratch.dmp[field], userDataService.dmp[field]);
                } else {
                    return angular.equals(userDataService.scratch.dmp[field][index], userDataService.dmp[field][index]);
                }
            }
        } else {
            return true;
        }
    };

    //Checks whether a scratch field has more cards than the DMP, indicating that a
    //new card has been added.
    userDataService.scratchHasExtraCard = function(field) {
        return (userDataService.scratch.dmp === undefined || userDataService.scratch.dmp[field] === undefined) ? false : (userDataService.scratch.dmp[field].length > userDataService.dmp[field].length);
    };

    //Gets the index of a card that has just been added to a field, returning
    //the last index if the provided index does not exist.
    userDataService.getNewCardIndex = function(field, index) {
        if (index >= 0 || index < userDataService.dmp[field].length) {
            return index;
        } else {
            return userDataService.dmp[field].length - 1;
        }
    };

    //Gets the difference between scratch and DMP field
    userDataService.scratchDMPDifference = function(field) {
        // $log.debug(userDataService.scratch.dmp);
        // return (userDataService.scratch.dmp === undefined) ? [] : (userDataService.scratch.dmp[field].filter(i1 => !userDataService.dmp[field].some(i2 => i1.id === i2.id)));
        return (userDataService.scratch.dmp === undefined) ? [] : (_.filter(userDataService.scratch.dmp[field], function(obj) {
            return !_.findWhere(userDataService.dmp[field], obj);
        }));
    };

    //Checks whether the difference between DMP and scratch is an empty card, or there is no difference.
    userDataService.scratchDMPDifferenceIsEmptyCards = function(field) {
        var diff = userDataService.scratchDMPDifference(field);
        if (!diff) {
            return true;
        }
        var result = true;
        var allkeys = [];
        var noprops = false;
        var value = '';
        //Check whether cards have no fields
        for (var i = 0; i < diff.length; i++) {
            allkeys = Object.keys(diff[i]);
            noprops = (allkeys.length === 0);

            //Check whether fields are empty strings if they exist.
            if (!noprops) {
                var allempty = true;
                for (j = 0; j < allkeys.length; j++) {
                    value = diff[i][allkeys[j]];
                    allempty = allempty && (value === '' || value === undefined);
                }
                noprops = allempty;
                // $log.debug(noprops);
            }

            result = result && noprops;
        }
        return result;
    };

    //Check for unsaved changes
    userDataService.hasUnsavedChanges = function(field) {

        if (userDataService.scratchEqualsDMP(field)) {
            return false;
        }
        return !(userDataService.scratchHasExtraCard(field) && userDataService.scratchDMPDifferenceIsEmptyCards(field));

    };

    //Puts a new card at the end of a field in the scratch array
    userDataService.newScratchCard = function(field) {
        //Only add a card if there's not an unsaved card
        if (!userDataService.scratchHasExtraCard(field)) {
            userDataService.scratch.dmp[field].push({});
        }
        return userDataService.scratch.dmp[field].length - 1;
    };

    //Deletes a particular card from the scratch array
    userDataService.deleteScratchCard = function(field, index) {
        userDataService.scratch.dmp[field].splice(index, 1);
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
                //Convert dates from string
                userDataService.dmp.projectDetails.dmpCreatedDate = new Date(userDataService.dmp.projectDetails.dmpCreatedDate);
                userDataService.dmp.projectDetails.lastUpdateDate = new Date(userDataService.dmp.projectDetails.lastUpdateDate);
                userDataService.dmp.projectDetails.lastAccessDate = new Date();
                userDataService.dmp.projectDetails.startDate = new Date(userDataService.dmp.projectDetails.startDate);
                if ((userDataService.dmp.projectDetails.endDate !== '') && (userDataService.dmp.projectDetails.endDate !== null)) {
                    userDataService.dmp.projectDetails.endDate = new Date(userDataService.dmp.projectDetails.endDate);
                }
                //Copy to scratch
                userDataService.scratch.dmp = angular.copy(userDataService.dmp);
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
        path = path.replace(/^(userDataService\.scratch\.dmp\.)/, "");
        path = path.replace(/^(userDataService\.dmp\.)/, "");
        return deep_value(helpTextService.dmpHelpText, path);
    };

    return helpTextService;

});

//Keeps track of which input cards are visible, and the index of the card that the
//details card should be associated with (-1 is a new card)
app.service('cardVisibilityService', function($http, $log, $timeout) {

    var cardVisibilityService = {};

    cardVisibilityService.document = {
        detailsCardVisible: false,
        addCardVisible: true,
        detailsCardIndex: 0
    };

    cardVisibilityService.contributor = {
        detailsCardVisible: false,
        detailsCardIndex: 0
    };

    function CardInit() {
        this.detailsCardVisible = false;
        this.addCardVisible = true;
        this.detailsCardIndex = 0;

    }

    //Switch to a details card, allowing time for short transition if another
    //details card is being displayed.
    cardVisibilityService.switchCardToIndex = function(categoryName, switchToNum) {
        // if (cardVisibilityService[categoryName].detailsCardVisible) {
        //     cardVisibilityService[categoryName].detailsCardVisible = false;
        //     cardVisibilityService[categoryName].detailsCardIndex = switchToNum;
        //     $timeout(function() {
        //         cardVisibilityService[categoryName].detailsCardVisible = true;
        //
        //     }, 100);
        // } else {
        cardVisibilityService[categoryName].detailsCardIndex = switchToNum;
        cardVisibilityService[categoryName].detailsCardVisible = true;
        // }
    };


    return cardVisibilityService;

});

//Loads field of research data from JSON
app.service('fieldOfResearchService', function($http) {

    var fieldOfResearchService = {};

    //Field of research search thingy.
    fieldOfResearchService.selectedItem = null;
    fieldOfResearchService.searchText = null;
    fieldOfResearchService.selectedFORs = [];


    //Get text for autocomplete, placeholder should be provided.
    fieldOfResearchService.getAutoCompleteInsert = function(placeholderText) {
        return "<md-autocomplete " +
            "md-selected-item=\"fieldOfResearchService.selectedItem\" " +
            "md-search-text=\"fieldOfResearchService.searchText\" " +
            "md-items=\"item in fieldOfResearchService.querySearch(fieldOfResearchService.searchText)\" " +
            placeholderText +
            "md-item-text=\"item.name\">" +
            "<span md-highlight-text=\"fieldOfResearchService.searchText\">{{item.name}}</span></md-autocomplete>" +
            "<md-chip-template>" +
            "<span>" +
            "<strong>{{$chip.name}} </strong>" +
            "<em>({{$chip.code}})</em>" +
            "</span>" +
            "</md-chip-template>";
    };


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

app.filter('prettyJSON', function() {
    return function(json) {
        return angular.toJson(json, true);
    };
});

app.directive('focus', function() {
    return function(scope, element, attrs) {
        element.focus();
    }
});


//http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(str) {
    return str.replace(/[\'\"]/g, "\\$&");
}

function addLeadingSpace(str) {
    return (str === "") ? "" : (" " + str);
}

//From stack exchange, gets nested fields from string
//Also removes list indices.
deep_value = function(obj, path, removeIndices = true) {
    if (removeIndices) {
        path = path.replace(/\[.+?\]/g, "");
    }
    for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {


        if (obj.hasOwnProperty(path[i]))
            obj = obj[path[i]];
        else {
            obj = {};
            return obj;
        }
    }
    if (obj === undefined) {
        obj = {};
    }

    return obj;
};
