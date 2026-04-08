import { escXml } from '../maml.js';

export default {
  id: 'flip_clock', icon: '🔄', name: '翻页时钟', desc: '大号数字翻页效果',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '翻页时钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#000000' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'digitColor', label: '数字颜色', type: 'color', default: '#ffffff' },
      { key: 'cardBgColor', label: '卡片背景', type: 'color', default: '#1a1a2e' },
      { key: 'sepColor', label: '分隔符颜色', type: 'color', default: '#6c5ce7' },
      { key: 'showSeconds', label: '显示秒', type: 'select', default: 'true', options: [
        { v: 'true', l: '是' }, { v: 'false', l: '否' },
      ]},
    ]},
  ],
  rawXml(c) {
    var showSec = c.showSeconds === 'true';
    var safeW = '(#view_width - #marginL - 40)';
    var digitW = 56, digitH = 80, gap = 8;
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '翻页时钟') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="hh" type="number" expression="#hour" />');
    lines.push('  <Var name="mm" type="number" expression="#minute" />');
    lines.push('  <Var name="h1" type="number" expression="floor(#hh / 10)" />');
    lines.push('  <Var name="h2" type="number" expression="mod(#hh, 10)" />');
    lines.push('  <Var name="m1" type="number" expression="floor(#mm / 10)" />');
    lines.push('  <Var name="m2" type="number" expression="mod(#mm, 10)" />');
    if (showSec) {
      lines.push('  <Var name="ss" type="number" expression="#second" />');
      lines.push('  <Var name="s1" type="number" expression="floor(#ss / 10)" />');
      lines.push('  <Var name="s2" type="number" expression="mod(#ss, 10)" />');
    }
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 翻页时钟内容组 -->');
    lines.push('  <Group name="flip_content" x="#marginL" y="40" w="' + safeW + '">');

    // Hour digits
    var x = 0;
    lines.push('    <!-- 时 -->');
    lines.push('    <Rectangle x="' + x + '" y="0" w="' + digitW + '" h="' + digitH + '" fillColor="' + c.cardBgColor + '" cornerRadius="8" />');
    lines.push('    <Text x="' + x + '" y="8" size="56" color="' + c.digitColor + '" textExp="#h1" bold="true" fontFamily="mipro-demibold" textAlign="center" w="' + digitW + '" />');
    x += digitW + gap;
    lines.push('    <Rectangle x="' + x + '" y="0" w="' + digitW + '" h="' + digitH + '" fillColor="' + c.cardBgColor + '" cornerRadius="8" />');
    lines.push('    <Text x="' + x + '" y="8" size="56" color="' + c.digitColor + '" textExp="#h2" bold="true" fontFamily="mipro-demibold" textAlign="center" w="' + digitW + '" />');
    x += digitW + gap + 4;

    // Separator
    lines.push('    <Text text=":" x="' + x + '" y="12" size="48" color="' + c.sepColor + '" bold="true" />');
    x += 24 + gap;

    // Minute digits
    lines.push('    <!-- 分 -->');
    lines.push('    <Rectangle x="' + x + '" y="0" w="' + digitW + '" h="' + digitH + '" fillColor="' + c.cardBgColor + '" cornerRadius="8" />');
    lines.push('    <Text x="' + x + '" y="8" size="56" color="' + c.digitColor + '" textExp="#m1" bold="true" fontFamily="mipro-demibold" textAlign="center" w="' + digitW + '" />');
    x += digitW + gap;
    lines.push('    <Rectangle x="' + x + '" y="0" w="' + digitW + '" h="' + digitH + '" fillColor="' + c.cardBgColor + '" cornerRadius="8" />');
    lines.push('    <Text x="' + x + '" y="8" size="56" color="' + c.digitColor + '" textExp="#m2" bold="true" fontFamily="mipro-demibold" textAlign="center" w="' + digitW + '" />');

    if (showSec) {
      x += digitW + gap + 4;
      lines.push('    <Text text=":" x="' + x + '" y="12" size="48" color="' + c.sepColor + '" bold="true" />');
      x += 24 + gap;
      lines.push('    <!-- 秒 -->');
      lines.push('    <Rectangle x="' + x + '" y="0" w="' + digitW + '" h="' + digitH + '" fillColor="' + c.cardBgColor + '" cornerRadius="8" />');
      lines.push('    <Text x="' + x + '" y="8" size="56" color="' + c.digitColor + '" textExp="#s1" bold="true" fontFamily="mipro-demibold" textAlign="center" w="' + digitW + '" />');
      x += digitW + gap;
      lines.push('    <Rectangle x="' + x + '" y="0" w="' + digitW + '" h="' + digitH + '" fillColor="' + c.cardBgColor + '" cornerRadius="8" />');
      lines.push('    <Text x="' + x + '" y="8" size="56" color="' + c.digitColor + '" textExp="#s2" bold="true" fontFamily="mipro-demibold" textAlign="center" w="' + digitW + '" />');
    }

    lines.push('  </Group>');
    lines.push('');
    lines.push('  <!-- 日期 -->');
    lines.push('  <Text x="#marginL" y="150" size="14" color="' + c.cardBgColor + '" textExp="formatDate(\'yyyy/MM/dd EEEE\', #time_sys)" alpha="0.8" />');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
