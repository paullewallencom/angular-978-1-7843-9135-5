
var geolocationPromise;
function getGeolocation() {
  if(!geolocationPromise) {
    geolocationPromise = new Promise(function(resolve, reject) {
      window.navigator.geolocation.getCurrentPosition(function(geo) {
        console.debug('Geolocation received from navigator');
        resolve(geo)
      }, reject);
    });
  }
  return geolocationPromise;
}

document.addEventListener("DOMContentLoaded", function(event) {
  var address = document.getElementById('address');
  getGeolocation().then(function(geo) {
    console.debug('Using geolocation promise in location widget');
    var client = new XMLHttpRequest();
    client.onload = function() {
      address.innerText = JSON.parse(this.response).results[0].formatted_address;
    };
    client.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+geo.coords.latitude+','+geo.coords.longitude);
    client.send();
  }).catch(function() {
    address.innerText = 'N/A';
  });
});

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
    $scope.$digest();
  }).catch(function userDoesNotTrustUs() {
    $scope.coordinates = {
      latitude: 'N/A',
      longitude: 'N/A'
    };
    $scope.$digest();
  });
}).factory('LocationService', function($q) {
  var geolocationPromise;
  return {
    getGeolocation: getGeolocation
  };
});
document.addEventListener("DOMContentLoaded", function(event) {
  var input = document.getElementById('city-input');
  var city = document.getElementById('city-name');
  var rejectFunction;
  input.addEventListener('keyup', function() {
    if(rejectFunction) {
      rejectFunction();
    }
    var start = new Date();
    var myPromise = new Promise(function(resolve, reject) {
      rejectFunction = reject;
      getGeolocation().then(function(geo) {
        console.log('Inside the new callback');
        var client = new XMLHttpRequest();
        client.onload = function() {
          resolve([JSON.parse(this.response).results[0], new Date() - start]);
        };
        var coords = geo.coords;
        var bounds = (coords.latitude -0.1) + ',' + (coords.longitude -0.1) + '|' + (coords.latitude +0.1) + ',' + (coords.longitude +0.1);
        client.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?address='+input.value+'&sensor=false&bounds='+bounds);
        client.send();
      }, reject);
    });

    myPromise.then(function(data) {
      console.debug(data);
      var result = data[0];
      if(result) {
        city.innerText = result.formatted_address;
        document.getElementById('load-time').innerText = 'Search took ' + (data[1] / 1000) + ' seconds';
      }
    });
  });
});
document.addEventListener("DOMContentLoaded", function(event) {
  var charging = document.getElementById('charging');
  var level = document.getElementById('battery-level');

  navigator.getBattery().then(function(batteryManager) {
    charging.innerText = batteryManager.charging ? 'Yes' : 'No';
    level.innerText = (batteryManager.level * 100) + '%';
    level.className = 'fa fa-battery-' + Math.round(batteryManager.level * 4);
  });
});
document.addEventListener("DOMContentLoaded", function(event) {
  var click = document.getElementById('click-me');
  var last = document.getElementById('last');
  click.addEventListener('mousedown', function() {
    var clicking = new Promise(function executor(resolve, reject) {
      var start = new Date();
      click.onmouseup = function() {
        console.debug('Now we re talking');
        resolve(new Date() - start);
      }
      click.onmouseout = reject;
    });

    clicking.then(function(duration) {
      last.innerText = (duration / 1000) + ' seconds';
    }, function() {
      window.alert('Please play with me');
    });
  });
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
