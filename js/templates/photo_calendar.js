import { escXml } from '../maml.js';

export default {
  id: 'photo_calendar', icon: '📸', name: '照片日历', desc: '背景照片 + 半透明日历叠层',
  updater: 'DateTime.Day',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '照片日历' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#000000' },
    ]},
    { group: '叠层', fields: [
      { key: 'overlayColor', label: '叠层颜色', type: 'color', default: '#000000' },
      { key: 'overlayAlpha', label: '叠层透明度', type: 'range', min: 0, max: 100, default: 60 },
      { key: 'overlayPos', label: '叠层位置', type: 'select', default: 'bottom', options: [
        { v: 'bottom', l: '底部' }, { v: 'top', l: '顶部' }, { v: 'full', l: '全屏' },
      ]},
    ]},
    { group: '样式', fields: [
      { key: 'dateColor', label: '日期颜色', type: 'color', default: '#ffffff' },
      { key: 'dayColor', label: '星期颜色', type: 'color', default: '#aaaaaa' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#ff6b6b' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var alpha = ((c.overlayAlpha || 60) / 100).toFixed(2);
    var pos = c.overlayPos || 'bottom';
    var overlayY, overlayH;
    if (pos === 'top') { overlayY = '0'; overlayH = '100'; }
    else if (pos === 'full') { overlayY = '0'; overlayH = '#view_height'; }
    else { overlayY = '(#view_height - 100)'; overlayH = '100'; }
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Day" name="' + escXml(c.cardName || '照片日历') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 背景 (请在编辑器中替换为 Image 元素) -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 半透明叠层 -->');
    lines.push('  <Rectangle x="0" y="' + overlayY + '" w="#view_width" h="' + overlayH + '" fillColor="' + c.overlayColor + '" alpha="' + alpha + '" />');
    lines.push('');
    lines.push('  <!-- 日历信息 -->');
    lines.push('  <Group name="calendar_info" x="#marginL" y="' + overlayY + '" w="' + safeW + '">');
    lines.push('    <Text x="0" y="10" size="14" color="' + c.dayColor + '" textExp="formatDate(\'yyyy年MM月\', #time_sys)" />');
    lines.push('    <Text x="0" y="28" size="48" color="' + c.dateColor + '" textExp="formatDate(\'dd\', #time_sys)" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <Text x="0" y="76" size="14" color="' + c.accentColor + '" textExp="formatDate(\'EEEE\', #time_sys)" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
