import { escXml } from '../maml.js';

export default {
  id: 'slide_unlock', icon: '🔓', name: '滑动解锁', desc: '滑动解锁卡片，支持 Trigger 交互',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '滑动解锁' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
    ]},
    { group: '样式', fields: [
      { key: 'trackColor', label: '滑轨颜色', type: 'color', default: '#1a1a2e' },
      { key: 'thumbColor', label: '滑块颜色', type: 'color', default: '#6c5ce7' },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#555555' },
      { key: 'hintText', label: '提示文字', type: 'text', default: '← 滑动解锁' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'rectangle', x: 30, y: 240, w: 260, h: 56, color: c.trackColor, radius: 28, locked: false },
      { type: 'rectangle', x: 36, y: 246, w: 44, h: 44, color: c.thumbColor, radius: 22, locked: false },
      { type: 'text', text: c.hintText, x: 96, y: 258, size: 14, color: c.textColor, locked: false },
      { type: 'text', expression: "formatDate('HH:mm', #time_sys)", text: '12:34', x: 30, y: 100, size: 48, color: '#ffffff', bold: true, fontFamily: 'mipro-demibold', locked: false },
    ];
  },
  rawXml(c) {
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '滑动解锁') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <!-- 时间 -->',
      '  <Group x="#marginL" y="0">',
      '    <Text x="0" y="100" size="48" color="#ffffff" textExp="formatDate(\'HH:mm\', #time_sys)" bold="true" fontFamily="mipro-demibold" />',
      '',
      '    <!-- 滑动解锁条 -->',
      '    <Slider name="unlock_slider" bounceInitSpeed="800" bounceAccelation="1200">',
      '      <!-- 滑轨背景 -->',
      '      <Rectangle x="0" y="140" w="260" h="56" fillColor="' + c.trackColor + '" cornerRadius="28" />',
      '      <!-- 提示文字 -->',
      '      <Text x="66" y="152" size="14" color="' + c.textColor + '" text="' + escXml(c.hintText) + '" />',
      '',
      '      <StartPoint>',
      '        <!-- 滑块 -->',
      '        <Rectangle x="6" y="146" w="44" h="44" fillColor="' + c.thumbColor + '" cornerRadius="22" />',
      '        <Text x="14" y="160" size="16" color="#ffffff" text="→" />',
      '      </StartPoint>',
      '',
      '      <!-- 目标区域（滑轨最右端） -->',
      '      <EndPoint x="200" y="140" w="60" h="56" />',
      '',
      '      <!-- 触发：到达目标时执行 -->',
      '      <Trigger action="slider_reached">',
      '        <VariableCommand target="unlock_slider" value="1" />',
      '      </Trigger>',
      '    </Slider>',
      '',
      '    <!-- 底部提示 -->',
      '    <Text x="0" y="220" size="11" color="#333333" text="滑到右端解锁" />',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
