export default function (kibana) {

  return new kibana.Plugin({
    uiExports: {
      visTypes: ['plugins/3Dworld/3Dworld_vis']
    }
  });
};
