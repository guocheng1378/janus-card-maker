// ─── MAML: XML 生成 + 转义 ────────────────────────────────────────

JCM.escXml = function (s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;');
};

JCM.generateMAML = function (opts) {
  var lines = [];
  var attrs = 'screenWidth="' + opts.device.width + '" frameRate="0" scaleByDensity="false"';
  if (opts.updater) attrs += ' useVariableUpdater="' + opts.updater + '"';
  attrs += ' name="' + JCM.escXml(opts.cardName) + '"';
  lines.push('<Widget ' + attrs + '>');
  lines.push(opts.innerXml);

  if (opts.extraElements.length > 0) {
    lines.push('  <Group x="#marginL" y="0">');
    opts.extraElements.forEach(function (el) {
      lines.push(renderEl(el, opts.uploadedFiles));
    });
    lines.push('  </Group>');
  }

  lines.push('</Widget>');
  return lines.join('\n');
};

function renderEl(el, files) {
  var p = '    ';
  switch (el.type) {
    case 'text': {
      var t = 'text="' + JCM.escXml(el.text || '') + '"';
      var a = el.textAlign && el.textAlign !== 'left' ? ' textAlign="' + el.textAlign + '"' : '';
      var ml = el.multiLine ? ' multiLine="true"' : '';
      var w = el.multiLine || (el.textAlign && el.textAlign !== 'left') ? ' w="' + (el.w || 200) + '"' : '';
      var b = el.bold ? ' bold="true"' : '';
      return p + '<Text ' + t + ' x="' + el.x + '" y="' + el.y + '" size="' + el.size + '" color="' + el.color + '"' + w + a + ml + b + ' />';
    }
    case 'rectangle':
      return p + '<Rectangle x="' + el.x + '" y="' + el.y + '" w="' + el.w + '" h="' + el.h + '" fillColor="' + el.color + '"' + (el.radius ? ' cornerRadius="' + el.radius + '"' : '') + ' />';
    case 'circle':
      return p + '<Circle x="' + el.x + '" y="' + el.y + '" r="' + el.r + '" fillColor="' + el.color + '" />';
    case 'image': {
      var folder = el.src && files[el.src] && files[el.src].mimeType.indexOf('video/') === 0 ? 'videos' : 'images';
      return p + '<Image src="' + folder + '/' + JCM.escXml(el.src || '') + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 100) + '" h="' + (el.h || 100) + '" />';
    }
    case 'video':
      return p + '<Video src="videos/' + JCM.escXml(el.src || '') + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 240) + '" h="' + (el.h || 135) + '" autoPlay="true" loop="true" />';
    default:
      return '';
  }
}
