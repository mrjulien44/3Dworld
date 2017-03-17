import uiModules from 'ui/modules';
import threeDworldVisParamsTemplate from 'plugins/3Dworld/3Dworld_vis_params.html';
import noUiSlider from 'no-ui-slider';
import 'no-ui-slider/css/nouislider.css';
import 'no-ui-slider/css/nouislider.pips.css';
import 'no-ui-slider/css/nouislider.tooltips.css';

uiModules.get('kibana/3Dworld')
  .directive('threeDworldVisParams', function () {
    return {
      restrict: 'E',
      template: threeDworldVisParamsTemplate,
      link: function ($scope, $element) {
        const sliderContainer = $element[0];
        var slider = sliderContainer.querySelector('.echelle-slider');
        noUiSlider.create(slider, {
          start: [$scope.vis.params.echelle],
          connect: "lower",
          tooltips: true,
          step: 1,
          range: {'min': -50, 'max': 50},
          format: {to: (value) => parseInt(value), from: value => parseInt(value)}
        });
        slider.noUiSlider.on('change', function () {
          const SlideEchelle = slider.noUiSlider.get();
          $scope.vis.params.echelle = parseInt(SlideEchelle, 10);
          $scope.$apply();
        });
      }
    };
  });
