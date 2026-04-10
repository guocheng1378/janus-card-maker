// ─── MAML: XML 生成 + 转义 + 校验 ──────────────────────────────────
// v2: NumberImage, Mask, Slider, Button, Animation, Variable, Trigger, Expression 全面支持

export function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;');
}

function alphaAttr(el) {
  return (el.opacity !== undefined && el.opacity !== 100)
    ? ' alpha="' + (el.opacity / 100).toFixed(2) + '"'
    : '';
}

function visibilityAttr(el) {
  return el.visibility ? ' visibility="' + el.visibility + '"' : '';
}

// ── MAML 框架标签白名单（原样透传） ──
var FRAMEWORK_TAGS = {
  'Var': true, 'Variable': true, 'Permanence': true,
  'VariableBinders': true, 'MiPaletteBinder': true,
  'FolmeState': true, 'FolmeConfig': true,
  'Function': true, 'FunctionCommand': true,
  'IfCommand': true, 'Consequent': true, 'Alternate': true,
  'MultiCommand': true,
  'VariableCommand': true, 'PermanenceCommand': true,
  'BinderCommand': true, 'MusicCommand': true,
  'LottieCommand': true, 'FrameRateCommand': true,
  'ExternalCommand': true, 'ExternalCommands': true,
  'Trigger': true, 'Triggers': true,
  'Layer': true, 'VariableArray': true, 'Item': true,
  'ContentProvider': true, 'Content': true,
};

// ── 动画渲染：生成子动画标签 ──
function renderAnimations(el, files, indent) {
  var p = indent || '    ';
  var lines = [];
  var anims = el.animations || {};
  var animTypes = {
    position: 'PositionAnimation',
    size: 'SizeAnimation',
    rotation: 'RotationAnimation',
    alpha: 'AlphaAnimation',
    src: 'SrcAnimation'
  };

  for (var type in anims) {
    if (!anims[type] || anims[type].length === 0) continue;
    var tag = animTypes[type] || type;
    var aDelay = anims.delay ? ' delay="' + anims.delay + '"' : '';
    var aRepeat = anims.repeat !== undefined ? ' repeat="' + anims.repeat + '"' : '';
    var aName = anims.name ? ' name="' + escXml(anims.name) + '"' : '';
    lines.push(p + '  <' + tag + aDelay + aRepeat + aName + '>');
    anims[type].forEach(function (kf) {
      var attrs = ' time="' + kf.time + '"';
      if (kf.x !== undefined) attrs += ' x="' + kf.x + '"';
      if (kf.y !== undefined) attrs += ' y="' + kf.y + '"';
      if (kf.w !== undefined) attrs += ' w="' + kf.w + '"';
      if (kf.h !== undefined) attrs += ' h="' + kf.h + '"';
      if (kf.rotation !== undefined) attrs += ' rotation="' + kf.rotation + '"';
      if (kf.alpha !== undefined) attrs += ' alpha="' + kf.alpha + '"';
      if (kf.src) attrs += ' src="' + escXml(kf.src) + '"';
      lines.push(p + '    <A' + attrs + ' />');
    });
    lines.push(p + '  </' + tag + '>');
  }
  return lines.join('\n');
}

// ── 渲染子元素（支持 Group/Layer/MusicControl/Slider/Button 嵌套）──
function renderChildren(children, files, indent, renderer) {
  var fn = renderer || renderEl;
  var lines = [];
  children.forEach(function (child) {
    lines.push(fn(child, files, indent));
  });
  return lines.filter(Boolean).join('\n');
}

// ── 通用容器属性（Group/Slider/Button 共用）──
function containerAttrs(el) {
  var attrs = '';
  if (el.name) attrs += ' name="' + escXml(el.name) + '"';
  if (el.x !== undefined) attrs += ' x="' + el.x + '"';
  if (el.y !== undefined) attrs += ' y="' + el.y + '"';
  if (el.w !== undefined) attrs += ' w="' + el.w + '"';
  if (el.h !== undefined) attrs += ' h="' + el.h + '"';
  if (el.alpha !== undefined && el.alpha !== 1) attrs += ' alpha="' + el.alpha + '"';
  if (el.visibility) attrs += ' visibility="' + el.visibility + '"';
  if (el.align) attrs += ' align="' + el.align + '"';
  if (el.alignV) attrs += ' alignV="' + el.alignV + '"';
  return attrs;
}

// ── 渲染单个元素 ──
export function renderEl(el, files, indent, childRenderer) {
  var p = indent || '    ';
  var cr = childRenderer || renderEl;

  // ── 框架标签：从 children 中透传 ──
  if (el._rawXml) {
    return p + el._rawXml;
  }

  // ── MAML 框架标签名透传 ──
  if (el.type === 'framework' && el.tag && FRAMEWORK_TAGS[el.tag]) {
    var rawAttrs = '';
    if (el.attrs) {
      for (var k in el.attrs) {
        rawAttrs += ' ' + k + '="' + escXml(el.attrs[k]) + '"';
      }
    }
    var rawChildren = (el.children && el.children.length > 0)
      ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
      : '';
    return p + '<' + el.tag + rawAttrs + '>' + rawChildren + '</' + el.tag + '>';
  }

  switch (el.type) {

    // ════════════════════════════════════════
    //  Text 文字
    // ════════════════════════════════════════
    case 'text': {
      var t = el.expression ? 'textExp="' + el.expression + '"' : 'text="' + escXml(el.text || '') + '"';
      var a = el.textAlign && el.textAlign !== 'left' ? ' textAlign="' + el.textAlign + '"' : '';
      var ml = el.multiLine ? ' multiLine="true"' : '';
      var w = el.multiLine || (el.textAlign && el.textAlign !== 'left') || el.marqueeSpeed ? ' w="' + (el.w || 200) + '"' : '';
      var b = el.bold ? ' bold="true"' : '';
      var ff = el.fontFamily && el.fontFamily !== 'default' ? ' fontFamily="' + el.fontFamily + '"' : '';

      // 阴影
      var sh = '';
      if (el.shadow === 'light') sh = ' shadow="1" shadowColor="#000000"';
      else if (el.shadow === 'dark') sh = ' shadow="3" shadowColor="#000000"';
      else if (el.shadow === 'glow') sh = ' shadow="4" shadowColor="' + (el.color || '#ffffff') + '"';

      // 文字渐变
      var tg = '';
      if (el.textGradient && el.textGradient !== 'none') {
        var gradColors = { sunset: '#ff6b6b,#feca57', ocean: '#0984e3,#00cec9', neon: '#ff00ff,#00ffff', gold: '#f39c12,#fdcb6e', aurora: '#6c5ce7,#00b894' };
        var gc = el.textGradient === 'custom' ? (el.color || '#ffffff') + ',' + (el.gradientColor2 || '#ff6b6b') : gradColors[el.textGradient] || gradColors.sunset;
        var textGradOri = el.gradientOrientation && el.gradientOrientation !== 'top_bottom' ? el.gradientOrientation : 'top_bottom';
        tg = ' gradientColors="' + gc + '" gradientOrientation="' + textGradOri + '"';
      }

      // 文字描边
      var ts = '';
      if (el.textStroke && el.textStroke > 0) {
        ts = ' stroke="' + el.textStroke + '" strokeColor="' + (el.textStrokeColor || '#000000') + '"';
      }

      // 旋转（支持 3D）
      var rot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      if (el.rotationX) rot += ' rotationX="' + el.rotationX + '"';
      if (el.rotationY) rot += ' rotationY="' + el.rotationY + '"';
      if (el.rotationZ) rot += ' rotationZ="' + el.rotationZ + '"';

      // 多行间距
      var lh = el.multiLine && el.lineHeight && el.lineHeight !== 1.4 ? ' lineHeight="' + el.lineHeight + '"' : '';
      var sm = el.multiLine && el.spacingMult ? ' spacingMult="' + el.spacingMult + '"' : '';
      var sa = el.multiLine && el.spacingAdd ? ' spacingAdd="' + el.spacingAdd + '"' : '';

      // 跑马灯
      var mq = el.marqueeSpeed ? ' marqueeSpeed="' + el.marqueeSpeed + '"' : '';
      var mg = el.marqueeSpeed && el.marqueeGap ? ' marqueeGap="' + el.marqueeGap + '"' : '';

      // format + paras
      var fmt = el.format ? ' format="' + escXml(el.format) + '"' : '';
      var prs = el.paras ? ' paras="' + escXml(el.paras) + '"' : '';

      var textXml = p + '<Text ' + t + ' x="' + el.x + '" y="' + el.y + '" size="' + el.size + '" color="' + el.color + '"' + w + a + ml + b + ff + alphaAttr(el) + sh + tg + ts + rot + lh + sm + sa + mq + mg + fmt + prs + ' />';
      var animXml = renderAnimations(el, files, p);
      return animXml ? textXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Text>') : textXml;
    }

    // ════════════════════════════════════════
    //  Rectangle 矩形
    // ════════════════════════════════════════
    case 'rectangle': {
      var rectRot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      var blur = el.blur ? ' blur="' + el.blur + '"' : '';
      var rectStroke = el.strokeWidth > 0 ? ' stroke="' + el.strokeWidth + '" strokeColor="' + (el.strokeColor || '#ffffff') + '"' : '';

      if (el.fillColor2) {
        var gradOri = el.gradientOrientation && el.gradientOrientation !== 'top_bottom' ? ' gradientOrientation="' + el.gradientOrientation + '"' : '';
        var gradColors2 = el.gradientColors ? ' gradientColors="' + escXml(el.gradientColors) + '"' : '';
        var rectXml = p + '<Rectangle x="' + el.x + '" y="' + el.y + '" w="' + el.w + '" h="' + el.h + '" fillColor="' + el.color + '" fillColor2="' + el.fillColor2 + '"' + (el.radius ? ' cornerRadius="' + el.radius + '"' : '') + alphaAttr(el) + rectRot + blur + rectStroke + gradOri + gradColors2 + ' />';
        var animXml = renderAnimations(el, files, p);
        return animXml ? rectXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Rectangle>') : rectXml;
      }
      var rectXml = p + '<Rectangle x="' + el.x + '" y="' + el.y + '" w="' + el.w + '" h="' + el.h + '" fillColor="' + el.color + '"' + (el.radius ? ' cornerRadius="' + el.radius + '"' : '') + alphaAttr(el) + rectRot + blur + rectStroke + ' />';
      var animXml = renderAnimations(el, files, p);
      return animXml ? rectXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Rectangle>') : rectXml;
    }

    // ════════════════════════════════════════
    //  Circle 圆形
    // ════════════════════════════════════════
    case 'circle': {
      var cRot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      var cXml = p + '<Circle x="' + el.x + '" y="' + el.y + '" r="' + el.r + '" fillColor="' + el.color + '"' + alphaAttr(el) + cRot + ' />';
      var animXml = renderAnimations(el, files, p);
      return animXml ? cXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Circle>') : cXml;
    }

    // ════════════════════════════════════════
    //  Image 图片
    // ════════════════════════════════════════
    case 'image': {
      var srcFile = el.src || el.fileName || '';
      var folder = srcFile && files[srcFile] && files[srcFile].mimeType.indexOf('video/') === 0 ? 'videos' : 'images';
      var fitAttr = el.fit && el.fit !== 'cover' ? ' fitMode="' + el.fit + '"' : '';
      var imgRadius = el.radius ? ' cornerRadius="' + el.radius + '"' : '';
      var imgPivot = (el.pivotX ? ' pivotX="' + el.pivotX + '"' : '') + (el.pivotY ? ' pivotY="' + el.pivotY + '"' : '');
      var imgRot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      var imgAlign = el.align ? ' align="' + el.align + '"' : '';
      var imgAlignV = el.alignV ? ' alignV="' + el.alignV + '"' : '';
      var imgAnti = el.antiAlias ? ' antiAlias="true"' : '';
      var imgSrcId = el.srcid !== undefined ? ' srcid="' + el.srcid + '"' : '';
      var imgSrcExp = el.srcExp ? ' srcExp="' + escXml(el.srcExp) + '"' : '';
      var imgSrcFmt = el.srcFormat ? ' srcFormat="' + escXml(el.srcFormat) + '"' : '';
      var imgSrcFmtExp = el.srcFormatExp ? ' srcFormatExp="' + escXml(el.srcFormatExp) + '"' : '';
      var imgSrcParas = el.srcParas ? ' srcParas="' + escXml(el.srcParas) + '"' : '';

      var imgXml = p + '<Image src="' + folder + '/' + escXml(srcFile) + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 100) + '" h="' + (el.h || 100) + '"' + fitAttr + imgRadius + alphaAttr(el) + imgPivot + imgRot + imgAlign + imgAlignV + imgAnti + imgSrcId + imgSrcExp + imgSrcFmt + imgSrcFmtExp + imgSrcParas + ' />';
      var animXml = renderAnimations(el, files, p);
      return animXml ? imgXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Image>') : imgXml;
    }

    // ════════════════════════════════════════
    //  Video 视频
    // ════════════════════════════════════════
    case 'video':
      return p + '<Video src="videos/' + escXml(el.src || el.fileName || '') + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 240) + '" h="' + (el.h || 135) + '" autoPlay="true" loop="true" />';

    // ════════════════════════════════════════
    //  Arc 弧形（模拟）
    // ════════════════════════════════════════
    case 'arc':
      return p + '<!-- Arc: MAML 不原生支持 <Arc>，用 Circle 模拟 -->\n' +
        p + '<Circle x="' + el.x + '" y="' + el.y + '" r="' + (el.r || 40) + '" fillColor="' + el.color + '" />';

    // ════════════════════════════════════════
    //  Progress 进度条（模拟）
    // ════════════════════════════════════════
    case 'progress': {
      var pw = el.w || 200;
      var ph = el.h || 8;
      var pv = el.value || 60;
      var pr = el.radius || 4;
      var barW = Math.round(pw * pv / 100);
      return p + '<Rectangle x="' + el.x + '" y="' + el.y + '" w="' + pw + '" h="' + ph + '" fillColor="' + (el.bgColor || '#333333') + '" cornerRadius="' + pr + '" />\n' +
        p + '<Rectangle x="' + el.x + '" y="' + el.y + '" w="' + barW + '" h="' + ph + '" fillColor="' + el.color + '" cornerRadius="' + pr + '" />';
    }

    // ════════════════════════════════════════
    //  Lottie 动画
    // ════════════════════════════════════════
    case 'lottie': {
      var lottieSrc = el.src || el.fileName || '';
      var lottieName = el.name || '';
      var lottieAlign = el.align || 'center';
      var lottieLoop = el.loop !== undefined ? el.loop : 0;
      var lottieAuto = el.autoplay !== false ? 'true' : 'false';
      var lottieW = ' w="' + (el.w || 120) + '"';
      var lottieH = ' h="' + (el.h || 120) + '"';
      var lottieX = el.x !== undefined ? ' x="' + el.x + '"' : '';
      var lottieY = el.y !== undefined ? ' y="' + el.y + '"' : '';
      var lottieNameAttr = lottieName ? ' name="' + escXml(lottieName) + '"' : '';
      return p + '<Lottie src="' + escXml(lottieSrc) + '"' + lottieX + lottieY + lottieW + lottieH + ' align="' + lottieAlign + '" autoplay="' + lottieAuto + '" loop="' + lottieLoop + '"' + lottieNameAttr + ' />';
    }

    // ════════════════════════════════════════
    //  NumberImage 数字图片（NEW）
    // ════════════════════════════════════════
    case 'numberimage': {
      var niNum = el.expression ? ' numberExp="' + escXml(el.expression) + '"' : ' number="' + (el.number || '0') + '"';
      var niSrc = ' src="' + escXml(el.src || 'number') + '"';
      var niX = ' x="' + el.x + '"';
      var niY = ' y="' + el.y + '"';
      var niW = ' w="' + (el.w || 30) + '"';
      var niH = ' h="' + (el.h || 50) + '"';
      var niSpace = el.space !== undefined ? ' space="' + el.space + '"' : '';
      var niAlign = el.align ? ' align="' + el.align + '"' : '';
      var niAlignV = el.alignV ? ' alignV="' + el.alignV + '"' : '';
      var niXml = p + '<Number' + niNum + niSrc + niX + niY + niW + niH + niSpace + niAlign + niAlignV + alphaAttr(el) + ' />';
      var animXml = renderAnimations(el, files, p);
      return animXml ? niXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Number>') : niXml;
    }

    // ════════════════════════════════════════
    //  Mask 图片遮罩（NEW）
    // ════════════════════════════════════════
    case 'mask': {
      var mSrc = ' src="' + escXml(el.src || '') + '"';
      var mX = ' x="' + (el.x || 0) + '"';
      var mY = ' y="' + (el.y || 0) + '"';
      var mAlign = el.align ? ' align="' + el.align + '"' : '';
      return p + '<Mask' + mSrc + mX + mY + mAlign + ' />';
    }

    // ════════════════════════════════════════
    //  Slider 滑动控件（NEW）
    // ════════════════════════════════════════
    case 'slider': {
      var slAttrs = '';
      if (el.name) slAttrs += ' name="' + escXml(el.name) + '"';
      if (el.bounceInitSpeed) slAttrs += ' bounceInitSpeed="' + el.bounceInitSpeed + '"';
      if (el.bounceAccelation) slAttrs += ' bounceAccelation="' + el.bounceAccelation + '"';
      if (el.alwaysShow) slAttrs += ' alwaysShow="true"';

      var slChildren = [];
      // 起始点
      if (el.startPoint && el.startPoint.length > 0) {
        slChildren.push(p + '  <StartPoint>');
        slChildren.push(renderChildren(el.startPoint, files, p + '    ', cr));
        slChildren.push(p + '  </StartPoint>');
      }
      // 目标点
      if (el.endPoint) {
        var ep = el.endPoint;
        slChildren.push(p + '  <EndPoint x="' + (ep.x || 0) + '" y="' + (ep.y || 0) + '" w="' + (ep.w || 100) + '" h="' + (ep.h || 100) + '" />');
      }
      // 触发器
      if (el.triggers && el.triggers.length > 0) {
        slChildren.push(renderChildren(el.triggers, files, p + '  ', cr));
      }

      var slBody = slChildren.length > 0 ? '\n' + slChildren.join('\n') + '\n' + p : '';
      return p + '<Slider' + slAttrs + '>' + slBody + '</Slider>';
    }

    // ════════════════════════════════════════
    //  Button 按钮控件（NEW）
    // ════════════════════════════════════════
    case 'button': {
      var btAttrs = containerAttrs(el);
      if (el.interceptTouch) btAttrs += ' interceptTouch="true"';
      if (el.touchable) btAttrs += ' touchable="true"';

      var btChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<Button' + btAttrs + '>' + btChildren + '</Button>';
    }

    // ════════════════════════════════════════
    //  Group 容器
    // ════════════════════════════════════════
    case 'group': {
      var attrs = containerAttrs(el);
      if (el.folmeMode) attrs += ' folmeMode="true"';
      if (el.contentDescription) attrs += ' contentDescriptionExp="' + escXml(el.contentDescription) + '"';
      if (el.interceptTouch) attrs += ' interceptTouch="true"';
      if (el.touchable) attrs += ' touchable="true"';
      if (el.frameRate !== undefined) attrs += ' frameRate="' + el.frameRate + '"';

      var children = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<Group' + attrs + '>' + children + '</Group>';
    }

    // ════════════════════════════════════════
    //  Layer 超级材质层
    // ════════════════════════════════════════
    case 'layer': {
      var layerAttrs = '';
      if (el.name) layerAttrs += ' name="' + escXml(el.name) + '"';
      if (el.alpha !== undefined) layerAttrs += ' alpha="' + el.alpha + '"';
      if (el.visibility) layerAttrs += ' visibility="' + el.visibility + '"';
      if (el.layerType) layerAttrs += ' layerType="' + el.layerType + '"';
      if (el.blurRadius !== undefined) layerAttrs += ' blurRadius="' + el.blurRadius + '"';
      if (el.blurColors) layerAttrs += ' blurColors="' + escXml(el.blurColors) + '"';
      if (el.colorModes !== undefined) layerAttrs += ' colorModes="' + el.colorModes + '"';
      if (el.frameRate !== undefined) layerAttrs += ' frameRate="' + el.frameRate + '"';
      if (el.updatePosition === false) layerAttrs += ' updatePosition="false"';
      if (el.updateSize === false) layerAttrs += ' updateSize="false"';
      if (el.updateTranslation === false) layerAttrs += ' updateTranslation="false"';

      var layerChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<Layer' + layerAttrs + '>' + layerChildren + '</Layer>';
    }

    // ════════════════════════════════════════
    //  MusicControl 音乐控件
    // ════════════════════════════════════════
    case 'musiccontrol': {
      var mcAttrs = '';
      if (el.name) mcAttrs += ' name="' + escXml(el.name) + '"';
      mcAttrs += ' w="' + (el.w || '(#view_width - #viewMarginLeft)') + '"';
      mcAttrs += ' h="' + (el.h || '#view_height') + '"';
      if (el.x !== undefined) mcAttrs += ' x="' + el.x + '"';
      if (el.y !== undefined) mcAttrs += ' y="' + el.y + '"';
      if (el.autoShow === false) mcAttrs += ' autoShow="false"';
      if (el.autoRefresh !== false) mcAttrs += ' autoRefresh="true"';
      if (el.enableLyric) mcAttrs += ' enableLyric="true"';
      if (el.updateLyricInterval) mcAttrs += ' updateLyricInterval="' + el.updateLyricInterval + '"';

      var mcChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<MusicControl' + mcAttrs + '>' + mcChildren + '</MusicControl>';
    }

    // ════════════════════════════════════════
    //  Variable 变量定义（NEW）
    // ════════════════════════════════════════
    case 'variable': {
      var vAttrs = ' name="' + escXml(el.name || '') + '"';
      vAttrs += ' expression="' + escXml(el.expression || '') + '"';
      if (el.varType) vAttrs += ' type="' + el.varType + '"';
      if (el.const) vAttrs += ' const="true"';
      if (el.threshold !== undefined) vAttrs += ' threshold="' + el.threshold + '"';
      if (el.persist) vAttrs += ' persist="true"';
      return p + '<Var' + vAttrs + ' />';
    }

    // ════════════════════════════════════════
    //  VariableArray 数组变量（NEW）
    // ════════════════════════════════════════
    case 'variablearray': {
      var vaAttrs = ' name="' + escXml(el.name || '') + '"';
      var vaItems = '';
      if (el.items && el.items.length > 0) {
        vaItems = '\n';
        el.items.forEach(function (item) {
          if (item.expression) {
            vaItems += p + '  <Item expression="' + escXml(item.expression) + '" />\n';
          } else {
            vaItems += p + '  <Item value="' + escXml(item.value || '') + '" />\n';
          }
        });
        vaItems += p;
      }
      return p + '<VariableArray' + vaAttrs + '>' + vaItems + '</VariableArray>';
    }

    // ════════════════════════════════════════
    //  Trigger 触发器（NEW）
    // ════════════════════════════════════════
    case 'trigger': {
      var trAttrs = el.action ? ' action="' + el.action + '"' : '';
      var trChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<Trigger' + trAttrs + '>' + trChildren + '</Trigger>';
    }

    // ════════════════════════════════════════
    //  各类 Command（NEW）
    // ════════════════════════════════════════
    case 'variablecommand': {
      var vcAttrs = '';
      if (el.target) vcAttrs += ' target="' + escXml(el.target) + '"';
      if (el.value) vcAttrs += ' value="' + escXml(el.value) + '"';
      if (el.expression) vcAttrs += ' expression="' + escXml(el.expression) + '"';
      return p + '<VariableCommand' + vcAttrs + ' />';
    }
    case 'bindercommand': {
      var bcAttrs = '';
      if (el.target) bcAttrs += ' target="' + escXml(el.target) + '"';
      if (el.value) bcAttrs += ' value="' + escXml(el.value) + '"';
      return p + '<BinderCommand' + bcAttrs + ' />';
    }
    case 'musiccommand': {
      var mcmdAttrs = '';
      if (el.action) mcmdAttrs += ' action="' + el.action + '"';
      return p + '<MusicCommand' + mcmdAttrs + ' />';
    }
    case 'frameratecommand': {
      var frcAttrs = '';
      if (el.target) frcAttrs += ' target="' + escXml(el.target) + '"';
      if (el.frameRate !== undefined) frcAttrs += ' frameRate="' + el.frameRate + '"';
      return p + '<FrameRateCommand' + frcAttrs + ' />';
    }
    case 'multicommand': {
      var mcCh = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<MultiCommand>' + mcCh + '</MultiCommand>';
    }

    // ════════════════════════════════════════
    //  IfCommand 条件分支（NEW）
    // ════════════════════════════════════════
    case 'ifcommand': {
      var ifAttrs = el.condition ? ' condition="' + escXml(el.condition) + '"' : '';
      var ifBody = '';
      if (el.consequent && el.consequent.length > 0) {
        ifBody += '\n' + p + '  <Consequent>\n';
        ifBody += renderChildren(el.consequent, files, p + '    ', cr) + '\n';
        ifBody += p + '  </Consequent>';
      }
      if (el.alternate && el.alternate.length > 0) {
        ifBody += '\n' + p + '  <Alternate>\n';
        ifBody += renderChildren(el.alternate, files, p + '    ', cr) + '\n';
        ifBody += p + '  </Alternate>';
      }
      if (ifBody) ifBody += '\n' + p;
      return p + '<IfCommand' + ifAttrs + '>' + ifBody + '</IfCommand>';
    }

    // ════════════════════════════════════════
    //  VariableBinders / ContentProvider（NEW）
    // ════════════════════════════════════════
    case 'variablebinders': {
      var vbChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<VariableBinders>' + vbChildren + '</VariableBinders>';
    }
    case 'contentprovider': {
      var cpAttrs = '';
      if (el.uri) cpAttrs += ' uri="' + escXml(el.uri) + '"';
      if (el.projection) cpAttrs += ' projection="' + escXml(el.projection) + '"';
      if (el.selection) cpAttrs += ' selection="' + escXml(el.selection) + '"';
      if (el.sortOrder) cpAttrs += ' sortOrder="' + escXml(el.sortOrder) + '"';
      var cpChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<ContentProvider' + cpAttrs + '>' + cpChildren + '</ContentProvider>';
    }
    case 'contentbinding': {
      var cbAttrs = '';
      if (el.name) cbAttrs += ' name="' + escXml(el.name) + '"';
      if (el.column) cbAttrs += ' column="' + escXml(el.column) + '"';
      return p + '<Content' + cbAttrs + ' />';
    }

    // ════════════════════════════════════════
    //  Permanence 持久化（NEW）
    // ════════════════════════════════════════
    case 'permanence': {
      var pmAttrs = '';
      if (el.name) pmAttrs += ' name="' + escXml(el.name) + '"';
      if (el.expression) pmAttrs += ' expression="' + escXml(el.expression) + '"';
      if (el.default !== undefined) pmAttrs += ' default="' + escXml(el.default) + '"';
      return p + '<Permanence' + pmAttrs + ' />';
    }

    // ════════════════════════════════════════
    //  FolmeState / FolmeConfig（NEW）
    // ════════════════════════════════════════
    case 'folmestate': {
      var fsAttrs = '';
      if (el.name) fsAttrs += ' name="' + escXml(el.name) + '"';
      var fsChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<FolmeState' + fsAttrs + '>' + fsChildren + '</FolmeState>';
    }
    case 'folmeconfig': {
      var fcChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<FolmeConfig>' + fcChildren + '</FolmeConfig>';
    }

    // ════════════════════════════════════════
    //  MiPaletteBinder 主题色绑定（NEW）
    // ════════════════════════════════════════
    case 'mipalettebinder': {
      var mpChildren = (el.children && el.children.length > 0)
        ? '\n' + renderChildren(el.children, files, p + '  ', cr) + '\n' + p
        : '';
      return p + '<MiPaletteBinder>' + mpChildren + '</MiPaletteBinder>';
    }

    // ════════════════════════════════════════
    //  Wallpaper 壁纸引用（NEW）
    // ════════════════════════════════════════
    case 'wallpaper': {
      var wpAttrs = ' x="0" y="0" w="#view_width" h="#view_height"';
      var wpXml = p + '<Wallpaper' + wpAttrs + alphaAttr(el) + ' />';
      var animXml = renderAnimations(el, files, p);
      return animXml ? wpXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Wallpaper>') : wpXml;
    }

    default:
      return '';
  }
}

// ── 响应式渲染: 将硬编码坐标转为 MAML 表达式，自动适配各机型 ──
var REF_W = 976, REF_H = 596;

function respX(val) {
  if (val <= 0) return '0';
  var marginL = Math.round(REF_W * 0.30);
  if (val > marginL) {
    var offset = val - marginL;
    return '(#marginL + round(' + offset + ' * #scaleX))';
  }
  return 'round(' + val + ' * #scaleX)';
}

function respY(val) {
  if (val <= 0) return '0';
  return 'round(' + val + ' * #scaleY)';
}

function respW(val) {
  if (val <= 0) return '0';
  return 'round(' + val + ' * #scaleX)';
}

function respH(val) {
  if (val <= 0) return '0';
  return 'round(' + val + ' * #scaleY)';
}

function respSize(val) {
  if (val <= 0) return '12';
  return 'round(' + val + ' * #scaleX)';
}

// 响应式动画渲染
function renderAnimationsResponsive(el, files, indent) {
  var p = indent || '    ';
  var lines = [];
  var anims = el.animations || {};
  var animTypes = {
    position: 'PositionAnimation',
    size: 'SizeAnimation',
    rotation: 'RotationAnimation',
    alpha: 'AlphaAnimation',
    src: 'SrcAnimation'
  };

  for (var type in anims) {
    if (!anims[type] || anims[type].length === 0) continue;
    var tag = animTypes[type] || type;
    var aDelay = anims.delay ? ' delay="' + anims.delay + '"' : '';
    var aRepeat = anims.repeat !== undefined ? ' repeat="' + anims.repeat + '"' : '';
    var aName = anims.name ? ' name="' + escXml(anims.name) + '"' : '';
    lines.push(p + '  <' + tag + aDelay + aRepeat + aName + '>');
    anims[type].forEach(function (kf) {
      var attrs = ' time="' + kf.time + '"';
      if (kf.x !== undefined) attrs += ' x="' + (type === 'position' ? respX(kf.x) : kf.x) + '"';
      if (kf.y !== undefined) attrs += ' y="' + (type === 'position' ? respY(kf.y) : kf.y) + '"';
      if (kf.w !== undefined) attrs += ' w="' + (type === 'size' ? respW(kf.w) : kf.w) + '"';
      if (kf.h !== undefined) attrs += ' h="' + (type === 'size' ? respH(kf.h) : kf.h) + '"';
      if (kf.rotation !== undefined) attrs += ' rotation="' + kf.rotation + '"';
      if (kf.alpha !== undefined) attrs += ' alpha="' + kf.alpha + '"';
      if (kf.src) attrs += ' src="' + escXml(kf.src) + '"';
      lines.push(p + '    <A' + attrs + ' />');
    });
    lines.push(p + '  </' + tag + '>');
  }
  return lines.join('\n');
}

export function renderElResponsive(el, files, indent) {
  var p = indent || '    ';
  if (el._rawXml) return p + el._rawXml;

  // 框架标签透传
  if (el.type === 'framework' && el.tag && FRAMEWORK_TAGS[el.tag]) {
    return renderEl(el, files, indent, renderElResponsive);
  }

  switch (el.type) {

    case 'text': {
      var t = el.expression ? 'textExp="' + el.expression + '"' : 'text="' + escXml(el.text || '') + '"';
      var a = el.textAlign && el.textAlign !== 'left' ? ' textAlign="' + el.textAlign + '"' : '';
      var ml = el.multiLine ? ' multiLine="true"' : '';
      var rw = el.multiLine || (el.textAlign && el.textAlign !== 'left') || el.marqueeSpeed ? ' w="' + respW(el.w || 200) + '"' : '';
      var b = el.bold ? ' bold="true"' : '';
      var ff = el.fontFamily && el.fontFamily !== 'default' ? ' fontFamily="' + el.fontFamily + '"' : '';
      var sh = '';
      if (el.shadow === 'light') sh = ' shadow="1" shadowColor="#000000"';
      else if (el.shadow === 'dark') sh = ' shadow="3" shadowColor="#000000"';
      else if (el.shadow === 'glow') sh = ' shadow="4" shadowColor="' + (el.color || '#ffffff') + '"';
      var tg = '';
      if (el.textGradient && el.textGradient !== 'none') {
        var gradColors = { sunset: '#ff6b6b,#feca57', ocean: '#0984e3,#00cec9', neon: '#ff00ff,#00ffff', gold: '#f39c12,#fdcb6e', aurora: '#6c5ce7,#00b894' };
        var gc = el.textGradient === 'custom' ? (el.color || '#ffffff') + ',' + (el.gradientColor2 || '#ff6b6b') : gradColors[el.textGradient] || gradColors.sunset;
        var tgo = el.gradientOrientation && el.gradientOrientation !== 'top_bottom' ? el.gradientOrientation : 'top_bottom';
        tg = ' gradientColors="' + gc + '" gradientOrientation="' + tgo + '"';
      }
      var ts = '';
      if (el.textStroke && el.textStroke > 0) ts = ' stroke="' + el.textStroke + '" strokeColor="' + (el.textStrokeColor || '#000000') + '"';
      var rot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      if (el.rotationX) rot += ' rotationX="' + el.rotationX + '"';
      if (el.rotationY) rot += ' rotationY="' + el.rotationY + '"';
      if (el.rotationZ) rot += ' rotationZ="' + el.rotationZ + '"';
      var lh = el.multiLine && el.lineHeight && el.lineHeight !== 1.4 ? ' lineHeight="' + el.lineHeight + '"' : '';
      var sm = el.multiLine && el.spacingMult ? ' spacingMult="' + el.spacingMult + '"' : '';
      var sa = el.multiLine && el.spacingAdd ? ' spacingAdd="' + el.spacingAdd + '"' : '';
      var mq = el.marqueeSpeed ? ' marqueeSpeed="' + el.marqueeSpeed + '"' : '';
      var mg = el.marqueeSpeed && el.marqueeGap ? ' marqueeGap="' + el.marqueeGap + '"' : '';
      var fmt = el.format ? ' format="' + escXml(el.format) + '"' : '';
      var prs = el.paras ? ' paras="' + escXml(el.paras) + '"' : '';
      var textXml = p + '<Text ' + t + ' x="' + respX(el.x) + '" y="' + respY(el.y) + '" size="' + respSize(el.size) + '" color="' + el.color + '"' + rw + a + ml + b + ff + alphaAttr(el) + sh + tg + ts + rot + lh + sm + sa + mq + mg + fmt + prs + ' />';
      var animXml = renderAnimationsResponsive(el, files, p);
      return animXml ? textXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Text>') : textXml;
    }

    case 'rectangle': {
      var rectRot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      var blur = el.blur ? ' blur="' + el.blur + '"' : '';
      var rectStroke = el.strokeWidth > 0 ? ' stroke="' + el.strokeWidth + '" strokeColor="' + (el.strokeColor || '#ffffff') + '"' : '';
      var gradOri = (el.fillColor2 && el.gradientOrientation && el.gradientOrientation !== 'top_bottom') ? ' gradientOrientation="' + el.gradientOrientation + '"' : '';
      var fillColor2 = el.fillColor2 ? ' fillColor2="' + el.fillColor2 + '"' : '';
      var gradColors2 = el.gradientColors ? ' gradientColors="' + escXml(el.gradientColors) + '"' : '';
      var rectXml = p + '<Rectangle x="' + respX(el.x) + '" y="' + respY(el.y) + '" w="' + respW(el.w) + '" h="' + respH(el.h) + '" fillColor="' + el.color + '"' + fillColor2 + (el.radius ? ' cornerRadius="' + el.radius + '"' : '') + alphaAttr(el) + rectRot + blur + rectStroke + gradOri + gradColors2 + ' />';
      var animXml = renderAnimationsResponsive(el, files, p);
      return animXml ? rectXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Rectangle>') : rectXml;
    }

    case 'circle': {
      var cRot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      var cXml = p + '<Circle x="' + respX(el.x) + '" y="' + respY(el.y) + '" r="' + respW(el.r) + '" fillColor="' + el.color + '"' + alphaAttr(el) + cRot + ' />';
      var animXml = renderAnimationsResponsive(el, files, p);
      return animXml ? cXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Circle>') : cXml;
    }

    case 'image': {
      var srcFile = el.src || el.fileName || '';
      var folder = srcFile && files[srcFile] && files[srcFile].mimeType.indexOf('video/') === 0 ? 'videos' : 'images';
      var fitAttr = el.fit && el.fit !== 'cover' ? ' fitMode="' + el.fit + '"' : '';
      var imgRadius = el.radius ? ' cornerRadius="' + el.radius + '"' : '';
      var imgPivot = (el.pivotX ? ' pivotX="' + el.pivotX + '"' : '') + (el.pivotY ? ' pivotY="' + el.pivotY + '"' : '');
      var imgRot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
      var imgAlign = el.align ? ' align="' + el.align + '"' : '';
      var imgAlignV = el.alignV ? ' alignV="' + el.alignV + '"' : '';
      var imgAnti = el.antiAlias ? ' antiAlias="true"' : '';
      var imgSrcId = el.srcid !== undefined ? ' srcid="' + el.srcid + '"' : '';
      var imgSrcExp = el.srcExp ? ' srcExp="' + escXml(el.srcExp) + '"' : '';
      var imgSrcFmt = el.srcFormat ? ' srcFormat="' + escXml(el.srcFormat) + '"' : '';
      var imgSrcFmtExp = el.srcFormatExp ? ' srcFormatExp="' + escXml(el.srcFormatExp) + '"' : '';
      var imgSrcParas = el.srcParas ? ' srcParas="' + escXml(el.srcParas) + '"' : '';
      var imgXml = p + '<Image src="' + folder + '/' + escXml(srcFile) + '" x="' + respX(el.x) + '" y="' + respY(el.y) + '" w="' + respW(el.w || 100) + '" h="' + respH(el.h || 100) + '"' + fitAttr + imgRadius + alphaAttr(el) + imgPivot + imgRot + imgAlign + imgAlignV + imgAnti + imgSrcId + imgSrcExp + imgSrcFmt + imgSrcFmtExp + imgSrcParas + ' />';
      var animXml = renderAnimationsResponsive(el, files, p);
      return animXml ? imgXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Image>') : imgXml;
    }

    case 'video':
      return p + '<Video src="videos/' + escXml(el.src || el.fileName || '') + '" x="' + respX(el.x) + '" y="' + respY(el.y) + '" w="' + respW(el.w || 240) + '" h="' + respH(el.h || 135) + '" autoPlay="true" loop="true" />';

    case 'progress': {
      var pw = respW(el.w || 200);
      var ph = respH(el.h || 8);
      var pv = el.value || 60;
      var pr = el.radius || 4;
      var barW = 'round(' + (el.w || 200) + ' * ' + (pv / 100) + ' * #scaleX)';
      return p + '<Rectangle x="' + respX(el.x) + '" y="' + respY(el.y) + '" w="' + pw + '" h="' + ph + '" fillColor="' + (el.bgColor || '#333333') + '" cornerRadius="' + pr + '" />\n' +
        p + '<Rectangle x="' + respX(el.x) + '" y="' + respY(el.y) + '" w="' + barW + '" h="' + ph + '" fillColor="' + el.color + '" cornerRadius="' + pr + '" />';
    }

    case 'numberimage': {
      var niNum = el.expression ? ' numberExp="' + escXml(el.expression) + '"' : ' number="' + (el.number || '0') + '"';
      var niSrc = ' src="' + escXml(el.src || 'number') + '"';
      var niXml = p + '<Number' + niNum + niSrc + ' x="' + respX(el.x) + '" y="' + respY(el.y) + '" w="' + respW(el.w || 30) + '" h="' + respH(el.h || 50) + '"' + (el.space !== undefined ? ' space="' + respW(el.space) + '"' : '') + (el.align ? ' align="' + el.align + '"' : '') + (el.alignV ? ' alignV="' + el.alignV + '"' : '') + alphaAttr(el) + ' />';
      var animXml = renderAnimationsResponsive(el, files, p);
      return animXml ? niXml.replace(/ \/>$/, '>\n' + animXml + '\n' + p + '</Number>') : niXml;
    }

    case 'slider':
    case 'button':
    case 'group':
    case 'layer':
    case 'musiccontrol':
    case 'variable':
    case 'variablearray':
    case 'trigger':
    case 'variablecommand':
    case 'bindercommand':
    case 'musiccommand':
    case 'frameratecommand':
    case 'multicommand':
    case 'ifcommand':
    case 'variablebinders':
    case 'contentprovider':
    case 'contentbinding':
    case 'permanence':
    case 'folmestate':
    case 'folmeconfig':
    case 'mipalettebinder':
    case 'wallpaper':
    case 'mask':
    case 'lottie':
    case 'arc':
      // 容器类元素需要传递响应式渲染器给子元素
      return renderEl(el, files, indent, renderElResponsive);

    default:
      return '';
  }
}

// ── 生成完整 MAML XML ──
export function generateMAML(opts) {
  var lines = [];

  // Widget 根标签
  var attrs = 'screenWidth="' + opts.device.width + '" frameRate="0" scaleByDensity="false"';
  if (opts.updater) attrs += ' useVariableUpdater="' + opts.updater + '"';
  attrs += ' name="' + escXml(opts.cardName) + '"';
  lines.push('<Widget ' + attrs + '>');

  // 变量定义（放在最前面）
  if (opts.variables && opts.variables.length > 0) {
    opts.variables.forEach(function (v) {
      lines.push('  <Var name="' + escXml(v.name) + '" expression="' + escXml(v.expression) + '"' + (v.varType ? ' type="' + v.varType + '"' : '') + (v.const ? ' const="true"' : '') + (v.threshold !== undefined ? ' threshold="' + v.threshold + '"' : '') + (v.persist ? ' persist="true"' : '') + ' />');
    });
  }

  // VariableBinders（ContentProvider 绑定）
  if (opts.variableBinders && opts.variableBinders.length > 0) {
    lines.push('  <VariableBinders>');
    opts.variableBinders.forEach(function (binder) {
      lines.push(renderEl(binder, opts.uploadedFiles, '    '));
    });
    lines.push('  </VariableBinders>');
  }

  // 背景图
  var innerXml = opts.innerXml;
  if (opts.bgImage) {
    var bgImgLine = '  <Image src="' + escXml(opts.bgImage) + '" x="0" y="0" w="#view_width" h="#view_height" />';
    if (innerXml.indexOf('<Rectangle') >= 0) {
      innerXml = innerXml.replace(/(  <Rectangle w="#view_width"[^>]*>)/, bgImgLine + '\n$1');
    } else {
      innerXml = bgImgLine + '\n' + innerXml;
    }
  }

  lines.push(innerXml);

  // 额外元素
  if (opts.extraElements && opts.extraElements.length > 0) {
    lines.push('  <Group x="#marginL" y="0">');
    opts.extraElements.forEach(function (el) {
      lines.push(renderEl(el, opts.uploadedFiles));
    });
    lines.push('  </Group>');
  }

  lines.push('</Widget>');
  return lines.join('\n');
}

// ── MAML 校验 ──
export function validateMAML(xml) {
  return validateMAMLRegex(xml);
}

function validateMAMLRegex(xml) {
  var errors = [];
  if (!xml.match(/<Widget[\s>]/)) errors.push('缺少 <Widget> 根标签');
  if (!xml.match(/<\/Widget>\s*$/)) errors.push('缺少 </Widget> 闭合标签');

  // 正确处理属性值中的 > 字符（如 expression="(#x > 5)"）
  var openCount = 0, selfCloseCount = 0;
  for (var i = 0; i < xml.length; i++) {
    if (xml[i] === '<' && i + 1 < xml.length && xml[i + 1].match(/[A-Z]/)) {
      // 跳过引号内的 > 找到真正的标签结束
      var tagEnd = -1, inQ = false, qC = '';
      for (var j = i + 1; j < xml.length; j++) {
        if (inQ) { if (xml[j] === qC) inQ = false; continue; }
        if (xml[j] === '"' || xml[j] === "'") { inQ = true; qC = xml[j]; continue; }
        if (xml[j] === '>') { tagEnd = j; break; }
      }
      if (tagEnd < 0) continue;
      if (xml[tagEnd - 1] === '/') selfCloseCount++;
      else openCount++;
    }
  }
  var closeTags = xml.match(/<\/[A-Z][a-zA-Z]*>/g) || [];

  if (openCount !== closeTags.length) {
    errors.push('标签开闭不匹配 (开:' + openCount + ' 闭:' + closeTags.length + ' 自闭:' + selfCloseCount + ')');
  }
  if (!xml.match(/name="/)) errors.push('缺少 name 属性');
  // 检查属性值中是否有未转义的 &（MAML 表达式含 <=, >=，不检查 <）
  if (xml.match(/="[^"]*(?:&[^a-zA-Z#;]|&[a-zA-Z]+(?:[^;a-zA-Z]|"[^"]*$))[^"]*"/)) {
    errors.push('属性值中存在未转义的 & 字符');
  }
  return { valid: errors.length === 0, errors: errors };
}
