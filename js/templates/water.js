import { escXml } from '../maml.js';

export default {
  id: 'water', icon: '💧', name: '喝水提醒', desc: '每日饮水目标追踪',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '喝水提醒' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a1628' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '目标', fields: [
      { key: 'goalCups', label: '每日目标 (杯)', type: 'range', min: 4, max: 16, default: 8 },
      { key: 'cupSize', label: '每杯容量 (ml)', type: 'select', default: '250', options: [
        { v: '200', l: '200ml' }, { v: '250', l: '250ml' }, { v: '300', l: '300ml' }, { v: '500', l: '500ml' },
      ]},
    ]},
    { group: '样式', fields: [
      { key: 'waterColor', label: '水滴颜色', type: 'color', default: '#4fc3f7' },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'trackColor', label: '空杯颜色', type: 'color', default: '#1a2040' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#4fc3f7' },
    ]},
  ],
  rawXml(c) {
    var goal = c.goalCups || 8;
    var cupMl = parseInt(c.cupSize) || 250;
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || '喝水提醒') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <!-- 注意: 饮水量需用户手动在配置中更新，此处展示目标进度 -->');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 喝水内容组 -->');
    lines.push('  <Group name="water_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <Text text="💧 今日饮水" x="0" y="20" size="16" color="' + c.textColor + '" bold="true" />');
    lines.push('    <Text text="目标 ' + goal + ' 杯 · ' + (goal * cupMl) + 'ml" x="0" y="44" size="12" color="' + c.textColor + '" alpha="0.5" />');
    lines.push('');

    // Render cup indicators
    var cols = Math.min(goal, 4);
    var rows = Math.ceil(goal / cols);
    var cupW = 28, cupH = 36, gap = 8;
    for (var i = 0; i < goal; i++) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = col * (cupW + gap);
      var cy = 70 + row * (cupH + gap + 14);
      lines.push('    <!-- 杯 ' + (i + 1) + ' -->');
      lines.push('    <Group name="cup_' + i + '" x="' + cx + '" y="' + cy + '" w="' + cupW + '">');
      lines.push('      <Rectangle x="0" y="0" w="' + cupW + '" h="' + cupH + '" fillColor="' + c.trackColor + '" cornerRadius="4" />');
      lines.push('      <Text text="💧" x="4" y="8" size="16" alpha="0.3" />');
      lines.push('    </Group>');
    }

    lines.push('    <!-- 提示 -->');
    lines.push('    <Text text="每小时喝一杯水 💪" x="0" y="(#view_height - 50)" size="12" color="' + c.accentColor + '" alpha="0.6" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
