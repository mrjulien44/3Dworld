import 'plugins/3Dworld/3Dworld_vis.less';
import 'plugins/3Dworld/3Dworld_vis_controller';
import 'plugins/3Dworld/3Dworld_vis_params';
import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';
import threeDworldTemplate from 'plugins/3Dworld/3Dworld_vis.html';
//import visTypes from 'ui/registry/vis_types';
import threeDworldVisParamsTemplate from 'plugins/3Dworld/3Dworld_vis_params.html';

require('ui/registry/vis_types').register(threeDworldVisTypeProvider);

function threeDworldVisTypeProvider(Private) {
  const TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  return new TemplateVisType({
    name: '3Dworld',
    title: '3D world',
    implementsRenderComplete: true,
    description: 'Cool 3D World',
    icon: 'fa-globe',
    template: threeDworldTemplate,
    params: {
      defaults: {
        globe: true,
        choixmap: 'world.jpg',
        subset: '5',
        animation: false,
        echelle:0,
        tooltip : false,
        rotation: false
      },
      choixmaps: ['world.jpg', 'globe.png','MEGP-World.jpg', 'medium_Map-Image.jpg', 'National-Georgaphics.jpg', 'geo-locating.jpg'],
      subsets: ['1', '2','3', '4', '5', '6','7','8'],
      //editor: threeDworldVisParamsTemplate
      editor: '<three-Dworld-vis-params></three-Dworld-vis-params>'
    },
    schemas: new Schemas([
        {
          group: 'metrics',
          name: 'count',
          title: 'count',
          min: 1,
          max: 1,
          aggFilter: ['count']
          //aggFilter: ['count', 'avg', 'sum', 'min', 'max', 'cardinality'],
          // defaults: [
          //   { schema: 'metric', type: 'count' }
          // ]
        },
        {
          group: 'buckets',
          name: 'coords',
          icon: 'fa fa-map-marker',
          title: 'Coordinates *',
          aggFilter: 'geohash_grid',
          min: 1,
          max: 1
        },
        {
          group: 'buckets',
          name: 'sensor',
          icon: 'fa fa-signal',
          title: 'Data *',
          min: 1,
          max: 1
        }
    ])
  });
};

export default threeDworldVisTypeProvider;
