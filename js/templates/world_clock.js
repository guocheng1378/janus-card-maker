import { escXml } from '../maml.js';

export default {
  id: 'world_clock', icon: '🌍', name: '世界时钟', desc: '同时显示多个时区的时间',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '世界时钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
    ]},
    { group: '时区 1', fields: [
      { key: 'tz1Label', label: '标签', type: 'text', default: '北京' },
      { key: 'tz1Offset', label: 'UTC偏移(小时)', type: 'range', min: -12, max: 12, default: 8 },
    ]},
    { group: '时区 2', fields: [
      { key: 'tz2Label', label: '标签', type: 'text', default: '东京' },
      { key: 'tz2Offset', label: 'UTC偏移(小时)', type: 'range', min: -12, max: 12, default: 9 },
    ]},
    { group: '时区 3', fields: [
      { key: 'tz3Label', label: '标签', type: 'text', default: '纽约' },
      { key: 'tz3Offset', label: 'UTC偏移(小时)', type: 'range', min: -12, max: 12, default: -5 },
    ]},
    { group: '样式', fields: [
      { key: 'timeColor', label: '时间颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
      { key: 'accentColor', label: '分隔线颜色', type: 'color', default: '#333333' },
      { key: 'activeColor', label: '当前时区高亮', type: 'color', default: '#4fc3f7' },
    ]},
  ],
  elements(c) {
    var tz1 = c.tz1Label || '北京';
    var tz2 = c.tz2Label || '东京';
    var tz3 = c.tz3Label || '纽约';
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', text: '🌍 世界时钟', x: 30, y: 30, size: 14, color: c.labelColor },
      { type: 'rectangle', x: 30, y: 55, w: 250, h: 1, color: c.accentColor },
      { type: 'text', text: tz1, x: 30, y: 75, size: 14, color: c.activeColor, bold: true },
      { type: 'text', text: '14:30', x: 30, y: 100, size: 40, color: c.timeColor, bold: true, fontFamily: 'mipro-demibold' },
      { type: 'rectangle', x: 30, y: 148, w: 250, h: 1, color: c.accentColor },
      { type: 'text', text: tz2, x: 30, y: 163, size: 14, color: c.labelColor },
      { type: 'text', text: '15:30', x: 30, y: 188, size: 40, color: c.timeColor, bold: true, fontFamily: 'mipro-demibold' },
      { type: 'rectangle', x: 30, y: 236, w: 250, h: 1, color: c.accentColor },
      { type: 'text', text: tz3, x: 30, y: 251, size: 14, color: c.labelColor },
      { type: 'text', text: '02:30', x: 30, y: 276, size: 40, color: c.timeColor, bold: true, fontFamily: 'mipro-demibold' },
    ];
  },
  rawXml(c) {
    var tz1L = escXml(c.tz1Label || '北京');
    var tz2L = escXml(c.tz2Label || '东京');
    var tz3L = escXml(c.tz3Label || '纽约');
    var o1 = Number(c.tz1Offset) || 8;
    var o2 = Number(c.tz2Offset) || 9;
    var o3 = Number(c.tz3Offset) || -5;
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '世界时钟') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <Group x="#marginL" y="0">',
      '    <!-- 标题 -->',
      '    <Text x="0" y="20" size="14" color="' + c.labelColor + '" text="🌍 世界时钟" />',
      '    <Rectangle x="0" y="45" w="250" h="1" fillColor="' + c.accentColor + '" />',
      '',
      '    <!-- 时区 1 -->',
      '    <Text x="0" y="65" size="14" color="' + c.activeColor + '" text="' + tz1L + '" bold="true" />',
      '    <Text x="0" y="90" size="40" color="' + c.timeColor + '" textExp="worldClockTime(' + o1 + ')" bold="true" fontFamily="mipro-demibold" />',
      '    <Rectangle x="0" y="138" w="250" h="1" fillColor="' + c.accentColor + '" />',
      '',
      '    <!-- 时区 2 -->',
      '    <Text x="0" y="153" size="14" color="' + c.labelColor + '" text="' + tz2L + '" />',
      '    <Text x="0" y="178" size="40" color="' + c.timeColor + '" textExp="worldClockTime(' + o2 + ')" bold="true" fontFamily="mipro-demibold" />',
      '    <Rectangle x="0" y="226" w="250" h="1" fillColor="' + c.accentColor + '" />',
      '',
      '    <!-- 时区 3 -->',
      '    <Text x="0" y="241" size="14" color="' + c.labelColor + '" text="' + tz3L + '" />',
      '    <Text x="0" y="266" size="40" color="' + c.timeColor + '" textExp="worldClockTime(' + o3 + ')" bold="true" fontFamily="mipro-demibold" />',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
