angular.module('SmashBoard', []).controller('TvController', function($scope, $http) {
  var now = Math.floor(new Date().getTime() / 1000);
  var url = 'http://companionapi.pink.cat/epgapi/singleslot/'+now+'?channels=[1,159,63,64]&format=json&o=1'
  var ajaxPromise = $http.get(url);
  ajaxPromise.then(function weGotData(response) {
    $scope.channels = response.data.events;
  });
})
.controller('LocationController', function($scope, LocationService){
  LocationService.getGeolocation().then(function geolocationReceived(geoposition) {
    $scope.coordinates = geoposition.coords;
  });
}).factory('LocationService', function($q) {
  return {
    getGeolocation: function() {
      var getGeo = $q.defer();
      window.navigator.geolocation.getCurrentPosition(function(geo) {
        getGeo.resolve(geo);
      });
      return getGeo.promise;
    }
  };
});
document.addEventListener("DOMContentLoaded", function(event) {
  var input = document.getElementById('say-what');
  var output = document.getElementById('status');
  input.addEventListener('blur', function() {
    var speaking = new Promise(function executor(success, failure) {
      // // For non Chrome users
      // var duration = Math.random() * 10000;
      // setTimeout(function() {
      //   success({ellapsedTime: duration})
      // }, duration);
      var msg = new SpeechSynthesisUtterance(input.value);
      msg.onend = success;
      speechSynthesis.speak(msg);
    });
    output.innerText = 'Speaking';
    speaking.then(function doneTalking(event) {
      console.debug(event);
      output.innerText = 'Done in '+event.elapsedTime+' seconds';
    });
  });
});
