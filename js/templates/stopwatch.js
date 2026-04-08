import { escXml } from '../maml.js';

export default {
  id: 'stopwatch', icon: '⏱️', name: '秒表', desc: '大字体计时器',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '秒表' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#000000' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'timeColor', label: '时间颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#666666' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#6c5ce7' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'text', text: '⏱️ 秒表', x: 10, y: 20, size: 14, color: c.labelColor, locked: false },
      { type: 'text', expression: "concat(floor(mod(floor(#time_sys / 1000), 3600) / 60), ':', ifelse((mod(floor(#time_sys / 1000), 60) < 10), '0', ''), mod(floor(#time_sys / 1000), 60))", text: '0:00', x: 10, y: 50, size: 72, color: c.timeColor, bold: true, fontFamily: 'mipro-demibold', locked: false },
      { type: 'text', expression: "concat('.', ifelse((mod(floor(#time_sys / 10), 100) < 10), '0', ''), mod(floor(#time_sys / 10), 100))", text: '.00', x: 10, y: 130, size: 36, color: c.accentColor, locked: false, opacity: 70 },
    ];
  },
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '秒表') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="elapsed" type="number" expression="floor(#time_sys / 1000)" />');
    lines.push('  <Var name="mins" type="number" expression="floor(#elapsed / 60)" />');
    lines.push('  <Var name="secs" type="number" expression="mod(#elapsed, 60)" />');
    lines.push('  <Var name="ms" type="number" expression="mod(floor(#time_sys / 10), 100)" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 秒表内容组 -->');
    lines.push('  <Group name="stopwatch_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <Text text="⏱️ 秒表" x="0" y="20" size="14" color="' + c.labelColor + '" />');
    lines.push('    <Text x="0" y="50" size="72" color="' + c.timeColor + '" textExp="concat(#mins, ifelse((#secs < 10), \':0\', \':\'), #secs)" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <Text x="0" y="130" size="36" color="' + c.accentColor + '" textExp="concat(\'.\', ifelse((#ms < 10), \'0\', \'), #ms)" alpha="0.7" />');
    lines.push('    <Rectangle x="0" y="178" w="' + safeW + '" h="1" fillColor="#222222" />');
    lines.push('    <Text text="计时中…" x="0" y="190" size="12" color="' + c.labelColor + '" alpha="0.4" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
