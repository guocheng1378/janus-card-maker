import { escXml } from '../maml.js';

export default {
  id: 'breathing', icon: '🌊', name: '呼吸灯', desc: '渐变色循环动画壁纸',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '呼吸灯' },
    ]},
    { group: '渐变', fields: [
      { key: 'color1', label: '颜色 1', type: 'color', default: '#6c5ce7' },
      { key: 'color2', label: '颜色 2', type: 'color', default: '#00cec9' },
      { key: 'color3', label: '颜色 3', type: 'color', default: '#e17055' },
    ]},
    { group: '文字', fields: [
      { key: 'text', label: '叠加文字', type: 'textarea', default: '深呼吸' },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'textSize', label: '字号', type: 'range', min: 16, max: 72, default: 36 },
      { key: 'showText', label: '显示文字', type: 'select', default: 'true', options: [
        { v: 'true', l: '是' }, { v: 'false', l: '否' },
      ]},
    ]},
  ],
  rawXml(c) {
    var ts = Number(c.textSize) || 36;
    var safeW = '(#view_width - #marginL - 40)';
    var textY = Math.round(596 * 0.35);
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" name="' + escXml(c.cardName || '呼吸灯') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="cycle" type="number" expression="(mod(floor(#time_sys / 1000), 6))" />');
    lines.push('  <Var name="phase1" type="number" expression="ifelse((#cycle < 3), (1 - #cycle / 3), ((#cycle - 3) / 3))" />');
    lines.push('');
    lines.push('  <!-- 渐变背景层 1 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.color1 + '" />');
    lines.push('');
    lines.push('  <!-- 渐变背景层 2 (呼吸效果) -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.color2 + '" alpha="#phase1" />');
    lines.push('');
    lines.push('  <!-- 渐变背景层 3 -->');
    lines.push('  <Rectangle x="(#view_width * 0.5)" w="(#view_width * 0.5)" h="#view_height" fillColor="' + c.color3 + '" alpha="0.4" />');

    if (c.showText !== 'false' && c.text) {
      lines.push('');
      lines.push('  <!-- 叠加文字 -->');
      lines.push('  <Group name="breath_text" x="#marginL" y="0" w="' + safeW + '">');
      lines.push('    <Text text="' + escXml(c.text) + '" x="0" y="' + textY + '" size="' + ts + '" color="' + c.textColor + '" w="' + safeW + '" multiLine="true" textAlign="center" lineHeight="1.5" />');
      lines.push('  </Group>');
    }

    lines.push('</Widget>');

    return lines.join('\n');
  },
};
