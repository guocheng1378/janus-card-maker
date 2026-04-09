import { escXml } from '../maml.js';

export default {
  id: 'persistent_counter', icon: '📊', name: '持久计数器', desc: '使用 Permanence 跨重启保存数据',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '计数器' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0d1117' },
    ]},
    { group: '样式', fields: [
      { key: 'numColor', label: '数字颜色', type: 'color', default: '#58a6ff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#8b949e' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#238636' },
      { key: 'label', label: '标签文字', type: 'text', default: '今日点击' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', text: c.label, x: 30, y: 60, size: 16, color: c.labelColor, locked: true },
      { type: 'text', text: '0', x: 30, y: 90, size: 72, color: c.numColor, bold: true, fontFamily: 'mipro-demibold', locked: false },
      { type: 'rectangle', x: 30, y: 180, w: 200, h: 4, color: c.accentColor, radius: 2, locked: false },
    ];
  },
  rawXml(c) {
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '计数器') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />',
      '',
      '  <!-- 持久化变量：跨重启保存 -->',
      '  <Permanence name="click_count" expression="0" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <Group x="#marginL" y="0">',
      '    <!-- 标签 -->',
      '    <Text x="0" y="60" size="16" color="' + c.labelColor + '" text="' + escXml(c.label || '今日点击') + '" />',
      '',
      '    <!-- 计数显示 -->',
      '    <Text x="0" y="90" size="72" color="' + c.numColor + '" textExp="#click_count" bold="true" fontFamily="mipro-demibold" />',
      '',
      '    <!-- 进度条 -->',
      '    <Rectangle x="0" y="180" w="200" h="4" fillColor="#1a1a2e" cornerRadius="2" />',
      '    <Rectangle x="0" y="180" w="0" h="4" fillColor="' + c.accentColor + '" cornerRadius="2" />',
      '',
      '    <!-- 点击按钮（增加计数） -->',
      '    <Button name="btn_inc" x="0" y="200" w="60" h="32">',
      '      <Rectangle x="0" y="0" w="60" h="32" fillColor="' + c.accentColor + '" cornerRadius="6" />',
      '      <Text x="16" y="8" size="14" color="#ffffff" text="+1" bold="true" />',
      '      <Trigger action="click">',
      '        <VariableCommand target="click_count" expression="#click_count + 1" />',
      '      </Trigger>',
      '    </Button>',
      '',
      '    <!-- 重置按钮 -->',
      '    <Button name="btn_reset" x="70" y="200" w="60" h="32">',
      '      <Rectangle x="0" y="0" w="60" h="32" fillColor="#333333" cornerRadius="6" />',
      '      <Text x="14" y="8" size="12" color="#888888" text="重置" />',
      '      <Trigger action="click">',
      '        <VariableCommand target="click_count" value="0" />',
      '      </Trigger>',
      '    </Button>',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
