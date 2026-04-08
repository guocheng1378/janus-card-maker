import { escXml } from '../maml.js';

export default {
  id: 'pixel_clock', icon: '🟩', name: '像素时钟', desc: '点阵风格时间显示',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '像素时钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a0a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'pixelOn', label: '点亮颜色', type: 'color', default: '#00ff88' },
      { key: 'pixelOff', label: '熄灭颜色', type: 'color', default: '#1a1a1a' },
      { key: 'pixelSize', label: '像素大小', type: 'range', min: 4, max: 12, default: 6 },
      { key: 'colonColor', label: '冒号颜色', type: 'color', default: '#00ff88' },
      { key: 'dateColor', label: '日期颜色', type: 'color', default: '#555555' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'text', expression: "formatDate('HH:mm', #time_sys)", text: '09:41', x: 10, y: 50, size: 64, color: c.pixelOn, bold: true, fontFamily: 'monospace', locked: false },
      { type: 'text', expression: "formatDate('yyyy/MM/dd EEEE', #time_sys)", text: '2026/04/08 周二', x: 10, y: 130, size: 14, color: c.dateColor, locked: false },
    ];
  },
  rawXml(c) {
    var ps = Number(c.pixelSize) || 6;
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '像素时钟') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="hh" type="number" expression="#hour" />');
    lines.push('  <Var name="mm" type="number" expression="#minute" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 像素时钟内容组 -->');
    lines.push('  <Group name="pixel_content" x="#marginL" y="30" w="' + safeW + '">');
    lines.push('    <!-- 用大号等宽字体模拟像素效果 -->');
    lines.push('    <Text x="0" y="0" size="' + (ps * 10) + '" color="' + c.pixelOn + '" textExp="formatDate(\'HH:mm\', #time_sys)" bold="true" fontFamily="monospace" />');
    lines.push('    <!-- 日期 -->');
    lines.push('    <Text x="0" y="' + (ps * 10 + 20) + '" size="14" color="' + c.dateColor + '" textExp="formatDate(\'yyyy/MM/dd EEEE\', #time_sys)" />');
    lines.push('    <!-- 装饰网格 -->');
    lines.push('    <Group name="pixel_grid" x="0" y="' + (ps * 10 + 46) + '" w="' + safeW + '">');
    for (var i = 0; i < 20; i++) {
      for (var j = 0; j < 3; j++) {
        lines.push('      <Rectangle x="' + (i * (ps + 2)) + '" y="' + (j * (ps + 2)) + '" w="' + ps + '" h="' + ps + '" fillColor="' + c.pixelOff + '" cornerRadius="1" />');
      }
    }
    lines.push('    </Group>');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
