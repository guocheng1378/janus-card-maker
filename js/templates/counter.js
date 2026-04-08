import { escXml } from '../maml.js';

export default {
  id: 'counter', icon: '🔢', name: '计数器', desc: '手动点按计数',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '计数器' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '内容', fields: [
      { key: 'label', label: '标签', type: 'text', default: '计数' },
      { key: 'startValue', label: '起始值', type: 'text', default: '0' },
      { key: 'step', label: '步长', type: 'range', min: 1, max: 10, default: 1 },
    ]},
    { group: '样式', fields: [
      { key: 'numberColor', label: '数字颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#6c5ce7' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" name="' + escXml(c.cardName || '计数器') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 计数器内容组 -->');
    lines.push('  <Group name="counter_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <Text text="' + escXml(c.label || '计数') + '" x="0" y="30" size="14" color="' + c.labelColor + '" />');
    lines.push('    <Text text="' + escXml(String(c.startValue || '0')) + '" x="0" y="60" size="80" color="' + c.numberColor + '" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <Rectangle x="0" y="160" w="' + safeW + '" h="1" fillColor="#222222" />');
    lines.push('    <Text text="步长: ' + (c.step || 1) + '" x="0" y="174" size="12" color="' + c.labelColor + '" alpha="0.5" />');
    lines.push('    <Text text="点击 + / - 按钮操作" x="0" y="196" size="11" color="' + c.accentColor + '" alpha="0.4" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
