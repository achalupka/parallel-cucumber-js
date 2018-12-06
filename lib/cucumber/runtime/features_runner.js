function FeaturesRunner(features, supportCodeLibrary, listeners, options) {
  var Cucumber = require('cucumber');

  // branch EventBroadcaster with access to supportCodeLibrary
  var eventBroadcaster = Cucumber.Runtime.EventBroadcaster(listeners, supportCodeLibrary);
  var featuresResult = Cucumber.Runtime.FeaturesResult(options.strict);

  var self = {
    run: function run(callback) {
      var event = Cucumber.Runtime.Event(Cucumber.Events.FEATURES_EVENT_NAME, features);
      eventBroadcaster.broadcastAroundEvent(
        event,
        function (callback) {
          Cucumber.Util.asyncForEach(features, self.runFeature, function() {
            self.broadcastFeaturesResult(callback);
          });
        },
        function() {
          callback(featuresResult.isSuccessful());
        }
      );
    },

    broadcastFeaturesResult: function visitFeaturesResult(callback) {
      var event = Cucumber.Runtime.Event(Cucumber.Events.FEATURES_RESULT_EVENT_NAME, featuresResult);
      eventBroadcaster.broadcastEvent(event, callback);
    },

    runFeature: function runFeature(feature, callback) {
      if (!featuresResult.isSuccessful() && options.failFast) {
        return callback();
      }
      var event = Cucumber.Runtime.Event(Cucumber.Events.FEATURE_EVENT_NAME, feature);
      eventBroadcaster.broadcastAroundEvent(
        event,
        function (callback) {
            //Cucumber.Util.asyncForEach(feature.getScenarios(), self.runScenario, callback);

            var scenarios = feature.getScenarios();
            var nextFunction = function(scenarios, index) {
                console.log("index =" + index + " length = " + scenarios.length);
                if (index === scenarios.length - 1) {
                    self.runScenario(scenarios[index], callback);
                } else if (index < scenarios.length - 2) {
                    var nextIndex = index + 1;

                    self.runScenario(scenarios[index], nextFunction(scenarios, nextIndex));
                } else {
                    callback();
                }
            };
            if (scenarios.length === 1) {
                self.runScenario(scenarios[0], callback);
            } else {
                self.runScenario(scenarios[0], nextFunction(scenarios, 1));
            }
        },
        callback
      );
    },

    runScenario: function runScenario(scenario, callback) {
      if (!featuresResult.isSuccessful() && options.failFast) {
        return callback();
      }

      var scenarioRunner = Cucumber.Runtime.ScenarioRunner(scenario, supportCodeLibrary, eventBroadcaster, options);
      scenarioRunner.run(function(scenarioResult) {
        featuresResult.witnessScenarioResult(scenarioResult);
        callback();
      });
    }
  };
  return self;
}

module.exports = FeaturesRunner;
