
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
})
.controller('WeatherForecastController', function($scope, $q, $http, LocationService) {
    LocationService.getGeolocation().then(function(geo) {
        $scope.latlng = geo.coords.latitude + ', ' + geo.coords.longitude;
        return $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+geo.coords.latitude+','+geo.coords.longitude);
    }).then(function(response) {
        if(response.data.status === 'ZERO_RESULTS') {
            throw 'Error: No Good';
        }
        var components = response.data.results[0].address_components;
        var query = [];
        for(var c in components) {
            c = components[c];
            if(c){
                if(c.types.indexOf('locality') !== -1 || c.types.indexOf('country') !== -1) {
                    query.push(c.long_name);
                }
            }
        }
        var city = query.join(',');
        $scope.city = city;

        return $http.get('http://apidev.accuweather.com/locations/v1/search?apikey=meSocYcloNe&q='+city);
    }).then(function(response) {
        var result = response.data[0];
        return $http.get('http://apidev.accuweather.com/currentconditions/v1/'+result.Key+'.json?language=en&apikey=meSocYcloNe')
    }).then(function(response) {
        $scope.weather = response.data[0].WeatherText;
        $scope.temperature = response.data[0].Temperature.Metric.Value;
    }).catch(window.alert);
})
.controller('RepositoriesController', function($scope, GithubService) {
    $scope.getUserRepos = function() {
        GithubService.getRepoNames($scope.username).then(function(names) {
            $scope.repositories = names;
        });
    };
})
.controller('GithubRepoAvailabilityController', function($scope, GithubService) {
    $scope.checkRepoAvailability = function() {
        $scope.status = 'Checking';
        GithubService.checkRepoAvailability($scope.username, $scope.repository).then(function(status) {
            $scope.status = status;
        }, function(reason) {
            $scope.status = 'An error has occurred: ' + reason;
        });
    };
})
.factory('GithubService', function($http, $q) {
    var service = {
        getRepos: function(username) {
            return $http.get('https://api.github.com/users/'+username+'/repos')
                .then(function(response) {
                    return response.data;
                });
        },
        getRepoNames: function(username) {
            return service.getRepos(username).then(function(data) {
                return data.map(function(value) {
                    return value.name
                });
            });
        },
        checkRepoAvailability: function(username, repoName) {
            return $http.get('https://api.github.com/repos/'+username+'/'+repoName)
                .then(function(response) {
                    return 'Not available';
                })
                .catch(function(response) {
                    if(response.status === 404) {
                        return 'Available';
                    }
                    return $q.reject(response.status);
                });
        }
    };
    return service;
})
.controller('LoadtimeController', function($scope, $q, $http) {
  $scope.url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=3.1320276999999996,101.6717649';
  $scope.times = 10;
  $scope.check = function() {
    var promise;
    var start = new Date();
    for(var i=0; i < $scope.times; i++) {
        if(!promise) {
            promise = $http.get($scope.url);
        } else {
            promise = promise.then(function() {
                console.log(i, arguments);
                return $http.get($scope.url);
            });
        }
    }
    promise.then(function() {
      var duration = new Date() - start;
      $scope.duration = duration;
      $scope.average = duration / $scope.times;
    });
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
