import { escXml } from '../maml.js';

export default {
  id: 'pomodoro', icon: '🍅', name: '番茄钟', desc: '25分钟专注 + 5分钟休息倒计时',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '番茄钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a0a0a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '计时', fields: [
      { key: 'workMin', label: '专注时长 (分钟)', type: 'range', min: 15, max: 60, default: 25 },
      { key: 'breakMin', label: '休息时长 (分钟)', type: 'range', min: 3, max: 15, default: 5 },
    ]},
    { group: '样式', fields: [
      { key: 'timerColor', label: '计时颜色', type: 'color', default: '#ffffff' },
      { key: 'workColor', label: '专注强调色', type: 'color', default: '#e74c3c' },
      { key: 'breakColor', label: '休息强调色', type: 'color', default: '#00b894' },
      { key: 'trackColor', label: '轨道颜色', type: 'color', default: '#333333' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'text', text: '🍅 番茄钟', x: 10, y: 20, size: 16, color: c.timerColor, bold: true, locked: false },
      { type: 'text', expression: "concat(floor((#workMin * 60) / 60), ':00')", text: '25:00', x: 10, y: 60, size: 64, color: c.timerColor, bold: true, fontFamily: 'mipro-demibold', locked: false },
      { type: 'text', text: '专注中', x: 10, y: 140, size: 14, color: c.workColor, locked: false },
      { type: 'rectangle', x: 10, y: 170, w: 300, h: 6, color: c.trackColor, radius: 3, locked: false },
      { type: 'rectangle', x: 10, y: 170, w: 180, h: 6, color: c.workColor, radius: 3, locked: false },
    ];
  },
  rawXml(c) {
    var workS = (c.workMin || 25) * 60;
    var breakS = (c.breakMin || 5) * 60;
    var totalS = workS + breakS;
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '番茄钟') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="cycleSec" type="number" expression="(mod(floor(#time_sys / 1000), ' + totalS + '))" />');
    lines.push('  <Var name="isWork" type="number" expression="ifelse((#cycleSec < ' + workS + '), 1, 0)" />');
    lines.push('  <Var name="remain" type="number" expression="ifelse(#isWork, (' + workS + ' - #cycleSec), (' + totalS + ' - #cycleSec))" />');
    lines.push('  <Var name="remainMin" type="number" expression="floor(#remain / 60)" />');
    lines.push('  <Var name="remainSec" type="number" expression="mod(#remain, 60)" />');
    lines.push('  <Var name="pct" type="number" expression="ifelse(#isWork, ((#cycleSec * 100) / ' + workS + '), (((#cycleSec - ' + workS + ') * 100) / ' + breakS + '))" />');
    lines.push('  <Var name="barW" type="number" expression="(' + safeW + ' * #pct / 100)" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 番茄钟内容组 -->');
    lines.push('  <Group name="pomodoro_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <Text text="🍅 番茄钟" x="0" y="20" size="16" color="' + c.timerColor + '" bold="true" />');
    lines.push('    <!-- 倒计时 -->');
    lines.push('    <Text x="0" y="56" size="64" color="' + c.timerColor + '" textExp="concat(#remainMin, ifelse((#remainSec < 10), \':0\', \':\'), #remainSec)" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <!-- 状态 -->');
    lines.push('    <Text x="0" y="136" size="14" color="ifelse(#isWork, ' + c.workColor + ', ' + c.breakColor + ')" textExp="ifelse(#isWork, \'专注中\', \'休息中\')" />');
    lines.push('    <!-- 进度条 -->');
    lines.push('    <Group name="progress" x="0" y="164" w="' + safeW + '">');
    lines.push('      <Rectangle x="0" y="0" w="' + safeW + '" h="6" fillColor="' + c.trackColor + '" cornerRadius="3" />');
    lines.push('      <Rectangle x="0" y="0" w="#barW" h="6" fillColor="ifelse(#isWork, ' + c.workColor + ', ' + c.breakColor + ')" cornerRadius="3" />');
    lines.push('    </Group>');
    lines.push('    <Text x="0" y="182" size="11" color="' + c.timerColor + '" textExp="concat(#pct, \'%\')" alpha="0.4" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
