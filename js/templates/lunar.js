import { escXml } from '../maml.js';

export default {
  id: 'lunar', icon: '🌙', name: '农历卡片', desc: '农历日期 + 节气 + 宜忌',
  updater: 'DateTime.Day',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '农历卡片' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a0a0a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'solarColor', label: '公历颜色', type: 'color', default: '#ffffff' },
      { key: 'lunarColor', label: '农历颜色', type: 'color', default: '#e74c3c' },
      { key: 'termColor', label: '节气颜色', type: 'color', default: '#f39c12' },
      { key: 'yiColor', label: '宜颜色', type: 'color', default: '#00b894' },
      { key: 'jiColor', label: '忌颜色', type: 'color', default: '#e74c3c' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#e74c3c' },
    ]},
    { group: '自定义', fields: [
      { key: 'lunarText', label: '农历文本 (如: 二月十六)', type: 'text', default: '二月十六' },
      { key: 'termText', label: '节气 (如: 清明)', type: 'text', default: '清明' },
      { key: 'yiText', label: '宜', type: 'text', default: '出行 签约 开业' },
      { key: 'jiText', label: '忌', type: 'text', default: '搬家 动土' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Day" name="' + escXml(c.cardName || '农历卡片') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 农历内容组 -->');
    lines.push('  <Group name="lunar_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <!-- 公历 -->');
    lines.push('    <Text x="0" y="30" size="14" color="' + c.solarColor + '" textExp="formatDate(\'yyyy年\', #time_sys)" alpha="0.6" />');
    lines.push('    <Text x="0" y="50" size="56" color="' + c.solarColor + '" textExp="formatDate(\'MM/dd\', #time_sys)" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <Text x="0" y="116" size="16" color="' + c.solarColor + '" textExp="formatDate(\'EEEE\', #time_sys)" alpha="0.5" />');
    lines.push('    <!-- 分隔 -->');
    lines.push('    <Rectangle x="0" y="144" w="40" h="2" fillColor="' + c.accentColor + '" cornerRadius="1" />');
    lines.push('    <!-- 农历 -->');
    lines.push('    <Text text="农历 ' + escXml(c.lunarText || '二月十六') + '" x="0" y="160" size="20" color="' + c.lunarColor + '" bold="true" />');
    if (c.termText) {
      lines.push('    <Text text="✦ ' + escXml(c.termText) + '" x="0" y="190" size="14" color="' + c.termColor + '" />');
    }
    lines.push('    <!-- 宜忌 -->');
    lines.push('    <Group name="yiji" x="0" y="220" w="' + safeW + '">');
    lines.push('      <Text text="宜" x="0" y="0" size="12" color="' + c.yiColor + '" bold="true" />');
    lines.push('      <Text text="' + escXml(c.yiText || '') + '" x="24" y="0" size="12" color="' + c.yiColor + '" alpha="0.8" />');
    lines.push('      <Text text="忌" x="0" y="24" size="12" color="' + c.jiColor + '" bold="true" />');
    lines.push('      <Text text="' + escXml(c.jiText || '') + '" x="24" y="24" size="12" color="' + c.jiColor + '" alpha="0.8" />');
    lines.push('    </Group>');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
