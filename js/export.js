// ─── Export: ZIP 打包 ──────────────────────────────────────────────

JCM.exportZip = function (maml, cardName, elements, files, isCustom) {
  if (typeof JSZip === 'undefined') throw new Error('JSZip 未加载');

  var zip = new JSZip();
  zip.file('manifest.xml', maml);

  if (!isCustom) {
    zip.file('var_config.xml',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<WidgetConfig version="1">\n' +
      '  <OnOff name="isDisplayDefaultBg" displayTitle="显示默认背景" default="0"/>\n' +
      '</WidgetConfig>'
    );
  }

  var usedFiles = {};
  elements.forEach(function (el) {
    if ((el.type === 'image' || el.type === 'video') && el.fileName && files[el.fileName]) {
      usedFiles[el.fileName] = files[el.fileName];
    }
  });

  var keys = Object.keys(usedFiles);
  if (keys.length > 0) {
    var imgFolder = zip.folder('images');
    var vidFolder = zip.folder('videos');
    keys.forEach(function (fname) {
      var info = usedFiles[fname];
      if (info.mimeType.indexOf('video/') === 0) {
        vidFolder.file(fname, info.data);
      } else {
        imgFolder.file(fname, info.data);
      }
    });
  }

  var fileName = (cardName || 'card') + '.zip';

  return zip.generateAsync({ type: 'blob' }).then(function (blob) {
    // Android bridge
    if (typeof AndroidBridge !== 'undefined') {
      var reader = new FileReader();
      reader.onload = function () {
        AndroidBridge.saveZip(reader.result.split(',')[1], fileName);
      };
      reader.readAsDataURL(blob);
      return;
    }
    // Browser download
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  });
};
