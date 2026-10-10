/* BLR Landing Pro — كتلة تضمين صفحة هبوط. */
(function (wp, list) {
  var el = wp.element.createElement;
  wp.blocks.registerBlockType('blrlp/landing', {
    apiVersion: 3, title: 'BLR Landing', icon: 'layout', category: 'widgets',
    attributes: { id: { type: 'number', default: 0 } },
    edit: function (props) {
      var opts = [{ value: 0, label: '— اختر صفحة هبوط —' }].concat(list || []);
      return el('div', wp.blockEditor.useBlockProps({ style: { padding: 16, border: '1px dashed #999', borderRadius: 8 } }),
        el(wp.components.SelectControl, { label: 'BLR Landing', value: props.attributes.id, options: opts,
          onChange: function (v) { props.setAttributes({ id: parseInt(v, 10) || 0 }); } }));
    },
    save: function () { return null; }
  });
})(window.wp, window.BLRLP_LANDINGS);
