import { escXml } from '../maml.js';

export default {
  id: 'world_clock3', icon: '🌍', name: '世界时钟×3', desc: '同时显示三个时区',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '世界时钟' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#000000' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '城市 1', fields: [
      { key: 'city1', label: '城市名', type: 'text', default: '北京' },
      { key: 'offset1', label: '时区偏移 (小时)', type: 'range', min: -12, max: 12, default: 8 },
      { key: 'color1', label: '颜色', type: 'color', default: '#ffffff' },
    ]},
    { group: '城市 2', fields: [
      { key: 'city2', label: '城市名', type: 'text', default: '东京' },
      { key: 'offset2', label: '时区偏移 (小时)', type: 'range', min: -12, max: 12, default: 9 },
      { key: 'color2', label: '颜色', type: 'color', default: '#6c5ce7' },
    ]},
    { group: '城市 3', fields: [
      { key: 'city3', label: '城市名', type: 'text', default: '纽约' },
      { key: 'offset3', label: '时区偏移 (小时)', type: 'range', min: -12, max: 12, default: -5 },
      { key: 'color3', label: '颜色', type: 'color', default: '#00b894' },
    ]},
    { group: '样式', fields: [
      { key: 'timeSize', label: '时间字号', type: 'range', min: 20, max: 48, default: 32 },
      { key: 'dateColor', label: '日期颜色', type: 'color', default: '#666666' },
    ]},
  ],
  rawXml(c) {
    var ts = Number(c.timeSize) || 32;
    var o1 = Number(c.offset1) || 0;
    var o2 = Number(c.offset2) || 0;
    var o3 = Number(c.offset3) || 0;
    var safeW = '(#view_width - #marginL - 40)';
    var colW = '(' + safeW + ' / 3)';
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '世界时钟') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="t1" type="number" expression="(#time_sys + (' + (o1 * -3600000) + '))" />');
    lines.push('  <Var name="t2" type="number" expression="(#time_sys + (' + (o2 * -3600000) + '))" />');
    lines.push('  <Var name="t3" type="number" expression="(#time_sys + (' + (o3 * -3600000) + '))" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 世界时钟内容组 -->');
    lines.push('  <Group name="worldclock_content" x="#marginL" y="20" w="' + safeW + '">');

    var cities = [
      { name: c.city1 || '北京', color: c.color1, timeVar: '#t1' },
      { name: c.city2 || '东京', color: c.color2, timeVar: '#t2' },
      { name: c.city3 || '纽约', color: c.color3, timeVar: '#t3' },
    ];

    cities.forEach(function (city, i) {
      var x = '(' + colW + ' * ' + i + ')';
      lines.push('    <!-- ' + city.name + ' -->');
      lines.push('    <Group name="city_' + (i + 1) + '" x="' + x + '" y="0" w="' + colW + '">');
      lines.push('      <Text text="' + escXml(city.name) + '" x="0" y="0" size="12" color="' + c.dateColor + '" />');
      lines.push('      <Text x="0" y="18" size="' + ts + '" color="' + city.color + '" textExp="formatDate(\'HH:mm\', ' + city.timeVar + ')" bold="true" fontFamily="mipro-demibold" />');
      lines.push('      <Text x="0" y="' + (18 + ts + 4) + '" size="10" color="' + c.dateColor + '" textExp="formatDate(\'MM/dd\', ' + city.timeVar + ')" alpha="0.5" />');
      lines.push('    </Group>');
    });

    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
