import { escXml } from '../maml.js';

export default {
  id: 'dice', icon: '🎲', name: '骰子', desc: '随机骰子动画',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '骰子' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a1a2e' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'dotColor', label: '点颜色', type: 'color', default: '#ffffff' },
      { key: 'faceColor', label: '面颜色', type: 'color', default: '#2d2d44' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#6c5ce7' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var cx = '(' + safeW + ' / 2)';
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '骰子') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="diceVal" type="number" expression="(mod(floor(#time_sys / 3000), 6) + 1)" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 骰子内容组 -->');
    lines.push('  <Group name="dice_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <Text text="🎲 随机骰子" x="0" y="20" size="16" color="' + c.labelColor + '" />');
    lines.push('    <!-- 骰子面 -->');
    lines.push('    <Group name="dice_face" x="((' + safeW + ' - 100) / 2)" y="60">');
    lines.push('      <Rectangle x="0" y="0" w="100" h="100" fillColor="' + c.faceColor + '" cornerRadius="16" />');
    lines.push('      <!-- 点数文字 (简化显示) -->');
    lines.push('      <Text x="0" y="16" size="56" color="' + c.dotColor + '" textExp="#diceVal" bold="true" fontFamily="mipro-demibold" textAlign="center" w="100" />');
    lines.push('    </Group>');
    lines.push('    <Text text="每 3 秒自动刷新" x="0" y="180" size="11" color="' + c.accentColor + '" textAlign="center" w="' + safeW + '" alpha="0.5" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
