/* Gutenberg block: BLR Slider (no build step). */
(function (wp, sliders) {
  var el = wp.element.createElement;
  wp.blocks.registerBlockType('blr/slider', {
    apiVersion: 3,
    title: 'BLR Slider',
    icon: 'images-alt2',
    category: 'widgets',
    attributes: { id: { type: 'number', default: 0 } },
    edit: function (props) {
      var opts = [{ value: 0, label: '— اختر سلايدر —' }].concat(sliders || []);
      return el('div', wp.blockEditor.useBlockProps({ style: { padding: 16, border: '1px dashed #999', borderRadius: 8 } }),
        el(wp.components.SelectControl, {
          label: 'BLR Slider',
          value: props.attributes.id,
          options: opts,
          onChange: function (v) { props.setAttributes({ id: parseInt(v, 10) || 0 }); }
        }));
    },
    save: function () { return null; }
  });
})(window.wp, window.BLRS_SLIDERS);
