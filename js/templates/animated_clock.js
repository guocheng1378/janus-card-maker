import { escXml } from '../maml.js';

export default {
  id: 'animated_clock', icon: '🕐', name: '动画时钟', desc: '带弹跳动画的极简时钟',
  updater: 'DateTime.Second',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '动画时钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
    ]},
    { group: '样式', fields: [
      { key: 'timeColor', label: '时间颜色', type: 'color', default: '#ffffff' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#ff6b6b' },
      { key: 'timeSize', label: '时间字号', type: 'range', min: 48, max: 96, default: 72 },
    ]},
  ],
  elements(c) {
    var ts = Number(c.timeSize) || 72;
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', expression: "formatDate('HH:mm', #time_sys)", text: '12:34', x: 40, y: 120, size: ts, color: c.timeColor, bold: true, fontFamily: 'mipro-demibold',
        animations: { position: [{ time: 0, x: 40, y: 120 }, { time: 300, x: 40, y: 112 }, { time: 600, x: 40, y: 120 }], repeat: -1 } },
      { type: 'text', expression: "formatDate('ss', #time_sys)", text: '00', x: 40, y: 120 + Math.round(ts * 0.9), size: Math.round(ts * 0.35), color: c.accentColor, opacity: 70,
        animations: { alpha: [{ time: 0, alpha: 0.7 }, { time: 500, alpha: 1.0 }, { time: 1000, alpha: 0.7 }], repeat: -1 } },
      { type: 'rectangle', x: 40, y: 120 + Math.round(ts * 0.9) + 30, w: 40, h: 3, color: c.accentColor, radius: 1.5,
        animations: { size: [{ time: 0, w: 40, h: 3 }, { time: 500, w: 60, h: 3 }, { time: 1000, w: 40, h: 3 }], repeat: -1 } },
      { type: 'text', expression: "formatDate('EEEE MM/dd', #time_sys)", text: '星期五 04/04', x: 40, y: 120 + Math.round(ts * 0.9) + 45, size: 16, color: '#666666' },
    ];
  },
  rawXml(c) {
    var ts = Number(c.timeSize) || 72;
    var secY = 120 + Math.round(ts * 0.9);
    var barY = secY + 30;
    var dateY = barY + 15;
    return [
      '<Widget screenWidth="976" frameRate="30" scaleByDensity="false" useVariableUpdater="DateTime.Second" name="' + escXml(c.cardName || '动画时钟') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <!-- 时钟内容 -->',
      '  <Group name="clock_anim" x="#marginL" y="0">',
      '    <!-- 时间：带弹跳动画 -->',
      '    <Text x="0" y="120" size="' + ts + '" color="' + c.timeColor + '" textExp="formatDate(\'HH:mm\', #time_sys)" bold="true" fontFamily="mipro-demibold">',
      '      <PositionAnimation repeat="-1">',
      '        <A time="0" x="0" y="120" />',
      '        <A time="300" x="0" y="112" />',
      '        <A time="600" x="0" y="120" />',
      '      </PositionAnimation>',
      '    </Text>',
      '',
      '    <!-- 秒数：闪烁动画 -->',
      '    <Text x="0" y="' + secY + '" size="' + Math.round(ts * 0.35) + '" color="' + c.accentColor + '" textExp="formatDate(\'ss\', #time_sys)">',
      '      <AlphaAnimation repeat="-1">',
      '        <A time="0" alpha="0.7" />',
      '        <A time="500" alpha="1.0" />',
      '        <A time="1000" alpha="0.7" />',
      '      </AlphaAnimation>',
      '    </Text>',
      '',
      '    <!-- 强调线：伸缩动画 -->',
      '    <Rectangle x="0" y="' + barY + '" w="40" h="3" fillColor="' + c.accentColor + '" cornerRadius="1.5">',
      '      <SizeAnimation repeat="-1">',
      '        <A time="0" w="40" />',
      '        <A time="500" w="60" />',
      '        <A time="1000" w="40" />',
      '      </SizeAnimation>',
      '    </Rectangle>',
      '',
      '    <!-- 日期 -->',
      '    <Text x="0" y="' + dateY + '" size="16" color="#666666" textExp="formatDate(\'EEEE MM/dd\', #time_sys)" />',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
