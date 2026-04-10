import { escXml } from '../maml.js';

export default {
  id: 'number_clock', icon: '🔢', name: '数字时钟', desc: '用 Number 图片序列显示时间',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '数字时钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a0a' },
    ]},
    { group: '样式', fields: [
      { key: 'digitColor', label: '数字颜色', type: 'color', default: '#00ff88' },
      { key: 'dateColor', label: '日期颜色', type: 'color', default: '#666666' },
      { key: 'digitSize', label: '数字大小', type: 'range', min: 30, max: 80, default: 50 },
      { key: 'digitPrefix', label: '图片前缀', type: 'text', default: 'time', desc: '数字图片文件名前缀，如 time_0.png ~ time_9.png' },
    ]},
  ],
  elements(c) {
    var ds = Number(c.digitSize) || 50;
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', expression: "formatDate('HH:mm', #time_sys)", text: '12:34', x: 30, y: 100, size: ds, color: c.digitColor, bold: true, fontFamily: 'monospace' },
      { type: 'text', expression: "formatDate('yyyy/MM/dd EEEE', #time_sys)", text: '2026/04/04 星期五', x: 30, y: 100 + ds + 10, size: 16, color: c.dateColor },
    ];
  },
  rawXml(c) {
    var ds = Number(c.digitSize) || 50;
    var prefix = escXml(c.digitPrefix || 'time');
    var dateY = 100 + ds + 10;
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '数字时钟') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '  <Var name="hour" type="number" expression="#hour24" />',
      '  <Var name="min" type="number" expression="#minute" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <Group x="#marginL" y="0">',
      '    <!-- 小时十位 -->',
      '    <Number numberExp="int(#hour / 10)" src="' + prefix + '" x="0" y="100" w="' + ds + '" h="' + Math.round(ds * 1.3) + '" space="2" />',
      '    <!-- 小时个位 -->',
      '    <Number numberExp="int(mod(#hour, 10))" src="' + prefix + '" x="' + (ds + 4) + '" y="100" w="' + ds + '" h="' + Math.round(ds * 1.3) + '" space="2" />',
      '    <!-- 冒号 -->',
      '    <Text x="' + (ds * 2 + 10) + '" y="100" size="' + ds + '" color="' + c.digitColor + '" text=":" bold="true" />',
      '    <!-- 分钟十位 -->',
      '    <Number numberExp="int(#min / 10)" src="' + prefix + '" x="' + (ds * 2 + 20) + '" y="100" w="' + ds + '" h="' + Math.round(ds * 1.3) + '" space="2" />',
      '    <!-- 分钟个位 -->',
      '    <Number numberExp="int(mod(#min, 10))" src="' + prefix + '" x="' + (ds * 3 + 24) + '" y="100" w="' + ds + '" h="' + Math.round(ds * 1.3) + '" space="2" />',
      '',
      '    <!-- 日期 -->',
      '    <Text x="0" y="' + dateY + '" size="16" color="' + c.dateColor + '" textExp="formatDate(\'yyyy/MM/dd EEEE\', #time_sys)" />',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
