import { escXml } from '../maml.js';

export default {
  id: 'step_counter', icon: '🚶', name: '步数计', desc: '显示今日步数与目标进度',
  updater: 'Sensor',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '步数计' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a1a0a' },
      { key: 'stepGoal', label: '步数目标', type: 'range', min: 1000, max: 30000, default: 10000 },
    ]},
    { group: '样式', fields: [
      { key: 'stepColor', label: '步数颜色', type: 'color', default: '#00e676' },
      { key: 'barBgColor', label: '进度条背景', type: 'color', default: '#1a3a1a' },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'subColor', label: '副文字颜色', type: 'color', default: '#666666' },
    ]},
  ],
  elements(c) {
    var goal = Number(c.stepGoal) || 10000;
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', text: '🦶', x: 30, y: 30, size: 28, color: c.stepColor },
      { type: 'text', text: '今日步数', x: 70, y: 50, size: 14, color: c.subColor },
      { type: 'text', text: '7,832', x: 30, y: 90, size: 64, color: c.stepColor, bold: true, fontFamily: 'mipro-demibold' },
      { type: 'text', text: '/ ' + goal.toLocaleString() + ' 步', x: 30, y: 160, size: 14, color: c.subColor },
      { type: 'rectangle', x: 30, y: 185, w: 250, h: 8, color: c.barBgColor, radius: 4 },
      { type: 'rectangle', x: 30, y: 185, w: 195, h: 8, color: c.stepColor, radius: 4 },
      { type: 'text', text: '78% 完成', x: 30, y: 210, size: 12, color: c.subColor },
    ];
  },
  rawXml(c) {
    var goal = Number(c.stepGoal) || 10000;
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="Sensor" name="' + escXml(c.cardName || '步数计') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <Group x="#marginL" y="0">',
      '    <!-- 图标 -->',
      '    <Text x="0" y="20" size="28" color="' + c.stepColor + '" text="🦶" />',
      '',
      '    <!-- 标题 -->',
      '    <Text x="40" y="40" size="14" color="' + c.subColor + '" text="今日步数" />',
      '',
      '    <!-- 步数 -->',
      '    <Text x="0" y="80" size="64" color="' + c.stepColor + '" textExp="#step_count" bold="true" fontFamily="mipro-demibold" />',
      '',
      '    <!-- 目标 -->',
      '    <Text x="0" y="150" size="14" color="' + c.subColor + '" text="/ ' + goal + ' 步" />',
      '',
      '    <!-- 进度条背景 -->',
      '    <Rectangle x="0" y="175" w="250" h="8" fillColor="' + c.barBgColor + '" cornerRadius="4" />',
      '',
      '    <!-- 进度条 -->',
      '    <Rectangle x="0" y="175" w="0" h="8" fillColor="' + c.stepColor + '" cornerRadius="4" />',
      '',
      '    <!-- 百分比 -->',
      '    <Text x="0" y="200" size="12" color="' + c.subColor + '" textExp="div(mul(#step_count, 100), ' + goal + ') + &quot;% 完成&quot;" />',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
