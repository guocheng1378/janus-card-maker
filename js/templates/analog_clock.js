import { escXml } from '../maml.js';

export default {
  id: 'analog_clock', icon: '🕐', name: '模拟时钟', desc: '指针式表盘时钟',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '模拟时钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '表盘', fields: [
      { key: 'faceColor', label: '表盘颜色', type: 'color', default: '#1a1a2e' },
      { key: 'ringColor', label: '外圈颜色', type: 'color', default: '#333355' },
      { key: 'hourColor', label: '时针颜色', type: 'color', default: '#ffffff' },
      { key: 'minuteColor', label: '分针颜色', type: 'color', default: '#6c5ce7' },
      { key: 'dotColor', label: '中心点颜色', type: 'color', default: '#ff6b6b' },
      { key: 'tickColor', label: '刻度颜色', type: 'color', default: '#555555' },
      { key: 'clockSize', label: '表盘大小', type: 'range', min: 80, max: 200, default: 120 },
    ]},
  ],
  elements(c) {
    var r = Number(c.clockSize) || 120;
    return [
      { type: 'circle', x: 400, y: 130, r: r, color: c.ringColor, locked: false },
      { type: 'circle', x: 400, y: 130, r: r - 6, color: c.faceColor, locked: false },
      { type: 'circle', x: 400, y: 130, r: 5, color: c.dotColor, locked: false },
      { type: 'text', text: '12', x: 394, y: 130 - r + 12, size: 12, color: c.tickColor, locked: false },
      { type: 'text', text: '3', x: 400 + r - 18, y: 126, size: 12, color: c.tickColor, locked: false },
      { type: 'text', text: '6', x: 396, y: 130 + r - 24, size: 12, color: c.tickColor, locked: false },
      { type: 'text', text: '9', x: 400 - r + 8, y: 126, size: 12, color: c.tickColor, locked: false },
    ];
  },
  rawXml(c) {
    var r = Number(c.clockSize) || 120;
    var cx = '(#marginL + (#view_width - #marginL) / 2)';
    var cy = '130';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '模拟时钟') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="hour_angle" type="number" expression="((#hour % 12) * 30 + #minute * 0.5)" />');
    lines.push('  <Var name="min_angle" type="number" expression="(#minute * 6)" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 表盘 -->');
    lines.push('  <Group name="clock_face" x="' + cx + '" y="' + cy + '" align="center" alignV="center">');
    lines.push('    <Circle x="0" y="0" r="' + r + '" fillColor="' + c.ringColor + '" />');
    lines.push('    <Circle x="0" y="0" r="' + (r - 6) + '" fillColor="' + c.faceColor + '" />');
    lines.push('    <!-- 刻度 -->');
    lines.push('    <Text text="12" x="-6" y="' + (-r + 14) + '" size="12" color="' + c.tickColor + '" textAlign="center" w="12" />');
    lines.push('    <Text text="3" x="' + (r - 18) + '" y="-6" size="12" color="' + c.tickColor + '" />');
    lines.push('    <Text text="6" x="-3" y="' + (r - 24) + '" size="12" color="' + c.tickColor + '" textAlign="center" w="12" />');
    lines.push('    <Text text="9" x="' + (-r + 10) + '" y="-6" size="12" color="' + c.tickColor + '" />');
    lines.push('    <!-- 时针 (用矩形模拟) -->');
    lines.push('    <Rectangle name="hour_hand" x="-3" y="' + (-Math.round(r * 0.5)) + '" w="6" h="' + Math.round(r * 0.5) + '" fillColor="' + c.hourColor + '" cornerRadius="3" rotation="#hour_angle" />');
    lines.push('    <!-- 分针 -->');
    lines.push('    <Rectangle name="min_hand" x="-2" y="' + (-Math.round(r * 0.7)) + '" w="4" h="' + Math.round(r * 0.7) + '" fillColor="' + c.minuteColor + '" cornerRadius="2" rotation="#min_angle" />');
    lines.push('    <!-- 中心点 -->');
    lines.push('    <Circle x="0" y="0" r="5" fillColor="' + c.dotColor + '" />');
    lines.push('  </Group>');
    lines.push('');
    lines.push('  <!-- 日期 -->');
    lines.push('  <Group name="date_info" x="#marginL" y="' + (cy + r + 20) + '" w="(#view_width - #marginL - 40)">');
    lines.push('    <Text x="0" y="0" size="14" color="' + c.tickColor + '" textExp="formatDate(\'yyyy/MM/dd EEEE\', #time_sys)" textAlign="center" w="(#view_width - #marginL - 40)" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
