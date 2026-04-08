import { escXml } from '../maml.js';

export default {
  id: 'torch', icon: '🔦', name: '手电筒', desc: '手电筒开关状态 + 亮度',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '手电筒' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a0a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'onColor', label: '开启颜色', type: 'color', default: '#feca57' },
      { key: 'offColor', label: '关闭颜色', type: 'color', default: '#333333' },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '手电筒') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 手电筒内容组 -->');
    lines.push('  <Group name="torch_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <Text text="🔦 手电筒" x="0" y="20" size="16" color="' + c.textColor + '" bold="true" />');
    lines.push('    <!-- 开关指示 -->');
    lines.push('    <Group name="toggle" x="((' + safeW + ' - 120) / 2)" y="70">');
    lines.push('      <Circle x="60" y="40" r="40" fillColor="#222222" />');
    lines.push('      <Circle x="60" y="40" r="36" fillColor="' + c.offColor + '" />');
    lines.push('      <Text text="🔦" x="46" y="26" size="28" />');
    lines.push('    </Group>');
    lines.push('    <Text text="点击切换" x="0" y="160" size="12" color="' + c.textColor + '" textAlign="center" w="' + safeW + '" alpha="0.4" />');
    lines.push('    <!-- 状态文字 -->');
    lines.push('    <Text text="当前: 关闭" x="0" y="190" size="14" color="' + c.offColor + '" textAlign="center" w="' + safeW + '" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
