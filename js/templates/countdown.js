import { escXml } from '../maml.js';

export default {
  id: 'countdown', icon: '⏳', name: '倒计时', desc: '生日/节日/纪念日倒计时天数',
  updater: 'DateTime.Day',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '倒计时' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
      { key: 'eventName', label: '事件名称', type: 'text', default: '我的生日' },
      { key: 'targetDate', label: '目标日期 (MM-DD)', type: 'text', default: '12-25' },
    ]},
    { group: '样式', fields: [
      { key: 'daysColor', label: '天数颜色', type: 'color', default: '#ff6b6b' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#ffffff' },
      { key: 'subColor', label: '副文字颜色', type: 'color', default: '#666666' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#ff6b6b' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', text: c.eventName || '我的生日', x: 30, y: 40, size: 14, color: c.subColor },
      { type: 'text', text: '128', x: 30, y: 70, size: 80, color: c.daysColor, bold: true, fontFamily: 'mipro-demibold' },
      { type: 'text', text: '天', x: 30, y: 160, size: 20, color: c.labelColor },
      { type: 'rectangle', x: 30, y: 195, w: 60, h: 3, color: c.accentColor, radius: 1.5 },
      { type: 'text', text: '距离 ' + (c.targetDate || '12-25'), x: 30, y: 215, size: 13, color: c.subColor },
    ];
  },
  rawXml(c) {
    var evName = escXml(c.eventName || '我的生日');
    var dateStr = c.targetDate || '12-25';
    var parts = dateStr.split('-');
    var month = parseInt(parts[0]) || 12;
    var day = parseInt(parts[1]) || 25;
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Day" name="' + escXml(c.cardName || '倒计时') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <Group x="#marginL" y="0">',
      '    <!-- 事件名称 -->',
      '    <Text x="0" y="30" size="14" color="' + c.subColor + '" text="' + evName + '" />',
      '',
      '    <!-- 倒计时天数 -->',
      '    <Text x="0" y="60" size="80" color="' + c.daysColor + '" textExp="countdownDays(' + month + ',' + day + ')" bold="true" fontFamily="mipro-demibold" />',
      '',
      '    <!-- "天" 标签 -->',
      '    <Text x="0" y="150" size="20" color="' + c.labelColor + '" text="天" />',
      '',
      '    <!-- 强调线 -->',
      '    <Rectangle x="0" y="185" w="60" h="3" fillColor="' + c.accentColor + '" cornerRadius="1.5" />',
      '',
      '    <!-- 目标日期 -->',
      '    <Text x="0" y="205" size="13" color="' + c.subColor + '" text="距离 ' + dateStr + '" />',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
