import _ from 'lodash';
import uiModules from 'ui/modules';
import AggConfigResult from 'ui/vis/agg_config_result';
import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';
import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';

var geohash = require('plugins/3Dworld/lib/latlon-geohash.js');

const module = uiModules.get('kibana/3Dworld', ['kibana']);
module.controller('KbnthreeDworldController', function ($scope, $element, Private, getAppState, $timeout) {
  const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);
  //const palette = ['#DC143C', '#FFD700', '#228B22', '#20B2AA', '#FF00FF', '#D2691E', '#FA8072', '#006400', '#0000CD', '#9400D3', '#A0522D', '#00BFFF', '#3CB371', '#7CFC00', '#8B0000', '#EEE8AA', '#00FF7F','#87CEFA', '#FF69B4', '#B0C4DE'];

  $scope.$watchMulti(['esResponse', 'vis.params'], function ([resp]) {
    if (resp) {
      const vis = $scope.vis;
      const params = vis.params;
      // Get the column numbers
      try {
        var sensorAggId = vis.aggs.bySchemaName['sensor'][0].id;
        var coordsAggId = vis.aggs.bySchemaName['coords'][0].id;
        var visu="simple";
      } catch (err) {
         console.error("Missing aggregation(s)");
      }
      var coordsColumn = -1;
      var sensorColumn = -1;

      // Tabify response
      var table = tabifyAggResponse(vis, resp, {
        partialRows: params.showPatialRows,
        minimalColumns: vis.isHierarchical() && !params.showMeticsAtAllLevels,
        asAggConfigResults: true
      });

      table = table.tables[0];
      // console.log("table");
      // console.log(table);
      if (table === undefined) {
        $scope.data = null;
        return;
      }

      for (var i = 0; i < table.columns.length; i++) {
        var id = table.columns[i].aggConfig.id;
        switch (id) {
          case coordsAggId:
            coordsColumn = i;
            break;
          case sensorAggId:
            sensorColumn = i;
            break;
        }
      }
      // const status = ThreeDworld.getStatus();

      // if (ThreeDworld.STATUS.COMPLETE === status) {
      //   console.log('incomplete');
      // } else if (ThreeDworld.STATUS.INCOMPLETE === status) {
      //   console.log('complete');
      // }
      $element.trigger('renderComplete');
      var colors = {};

      $scope.data = table.rows.map(function(row) {
        var data = {};
        var sensor = row[sensorColumn].key;

        //Fill the colors array
        // if (colors[sensorColumn] === undefined) {
        //   colors[sensorColumn] = 0;
        // } else {
        //   colors[sensorColumn] += 1;
        // }
        data['sensor'] = sensor;
        data['coords'] = geohash.decode(row[coordsColumn].key);
        data['count'] = row[2].key;
        return data;
      });
      $scope.colors = {};
      //console.log($scope.data);
      $scope.GlobeGen($timeout);
    };

    $scope.GlobeGen = function(){

      /* (re)load the configuration */
      function loadConfig() {
        return {
          /* Global */
          "globe": $scope.vis.params.globe,
          "choixmap": $scope.vis.params.choixmap,
          "subset": parseInt($scope.vis.params.subset),
          "tooltip": $scope.vis.params.tooltip,
          "rotation": $scope.vis.params.rotation,
          "echelle": $scope.vis.params.echelle,
          "animation": $scope.vis.params.anomation
        };
      }

      //console.log("loadConfig");
      var config = loadConfig();
      var renderer;
      //if (config.globe === true) {
        //console.log("$element");
        //console.log($element);
        renderer = require("plugins/3Dworld/lib/globe.js");
        renderer.clear();
        renderer.setConfig(config, $timeout);
        renderer.init($element);
        renderer.renderEvents($scope.data);
        renderer.render();
      // } else {
      //   console.log("Non implémenté");
      // }
    };
  });
});