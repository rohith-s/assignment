var app = angular.module("app", []);
    app.controller("HttpGetController", function ($scope, $http) {
        
        $scope.show = false; 

        $scope.data = {
                primary_email_address: "",
                moxi_works_agent_id:"",
                first_name: "",
                last_name:"",
                home_street_address:"",

            };

        $scope.GetAllData = function () {
            debugger;
            $http.get('http://localhost:3000/locallist')
            .success(function (data, status, headers, config) {
                $scope.Details = data.data;
            })
                    };

                    $scope.importData = function () {
            debugger;
            $http.post('http://localhost:3000/createcontactall')
            .success(function (data, status, headers, config) {
                $scope.Details = data.data;
                this.GetAllData();
            })
                    };

                    $scope.showadd = function(){
                                $scope.show = true;

                    }

                    $scope.hideadd = function(){
                                $scope.show = !$scope.show;

                    }



                    $scope.SendData = function (modeldata) {

                        debugger;
            var data = modeldata;
        
            var config = {
                headers : {
                    'Content-Type': 'application/json'
                }
            }

            $http.post('http://localhost:3000/createcontact', data, config)
            .success(function (data, status, headers, config) {
$scope.data = {
                primary_email_address: "",
                moxi_works_agent_id:"",
                first_name: "",
                last_name:"",
                home_street_address:"",

            };            })
            
        };




        $scope.Deletedata = function (data) {
            debugger;
            $http.delete('http://localhost:3000/deletecontact?recId=' +data)
            .success(function (data, status) {
            })
                    };


       
    });