var app = angular.module('dmpOnlineTool', ['ngMaterial', 'ngMessages']);
app.controller('formCtrl', function($scope, $http, $log) {
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
        contributors: [{
            id: 0,
            firstname: "Sofia Arnold",
            affiliation: "dept",
            email: "name@invalid.invalid",
            username: "name002",
            orcid: "0000-0000-0000-0001"
        }, {
            id: 1,
            firstname: "Francesca Kirby",
            affiliation: "dept",
            email: "name2@invalid.invalid",
            username: "name002",
            orcid: "0000-0000-0000-0001"
        }, new Contributor(2)]
    };

    //A class for contributors
    function Contributor(id, firstname = "", affiliation = "", email = "", username = "", orcid = "") {
        this.id = id;
        this.firstname = firstname;
        this.affiliation = affiliation;
        this.email = email;
        this.username = username;
        this.orcid = orcid;
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


        var newContributor = new Contributor($scope.dmp.contributors.length);
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
app.controller('sideNavCtrl', function($scope, $timeout, $mdSidenav, $log) {
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
    })
    .controller('LeftCtrl', function($scope, $timeout, $mdSidenav, $log) {
        $scope.close = function() {
            // Component lookup should always be available since we are not using `ng-if`
            $mdSidenav('left').close()
                .then(function() {
                    $log.debug("close LEFT is done");
                });

        };
    });

function addContributor(divName) {
    var counter = 1;

    var upperlimit = 10;
    var lowerlimit = 1;
    var count = document.getElementById(divName).childElementCount + 1;
    if (count == upperlimit) {

        alert("You have reached the limit of adding " + counter + " inputs");

    } else {

        var newdiv = document.createElement('div');



        newdiv.innerHTML = "<div class='col s12' id='contributor" + count + "'>" +
            "<div class='col s11'>" +
            "<label>Contributor " + count + "</label>" +
            "<input type='text' name='myInputs[]'>" +
            "</div>" +
            "<div class='col s1'>" +
            "<a class='btn-floating waves-effect waves-light red' onclick=\"removeInput('contributor" + count + "');\"><i class='material-icons'>remove</i></a>" +
            "</div>" +
            "</div>";


        //"<label>Contributor " + nExisting + " </label><input type='text' name='myInputs[]' id=contributor>";

        document.getElementById(divName).appendChild(newdiv);

        counter++;

    }

}

//Need to update, remove is inconsistent apparently
function removeInput(divName) {
    //var child=document.getElementById(divName);
    //document.getElementById('contributors').removeChild(child);
    $("#" + divName).remove();

    //counter--;
}

function toggleElementEnable(checkBoxID, targetElementID) {

    if (document.getElementById(checkBoxID).checked) {
        document.getElementById(targetElementID).style.visibility = "hidden";
        document.getElementById(targetElementID).disabled = true;
    } else {
        document.getElementById(targetElementID).style.visibility = "visible";
        document.getElementById(targetElementID).disabled = false;
    }
}
