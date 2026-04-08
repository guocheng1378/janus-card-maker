import { escXml } from '../maml.js';

export default {
  id: 'multi_countdown', icon: '📋', name: '倒数日列表', desc: '多个事件同时倒计时',
  updater: 'DateTime.Day',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '倒数日' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '事件 1', fields: [
      { key: 'event1Name', label: '事件名', type: 'text', default: '新年' },
      { key: 'event1Date', label: '日期 (MMdd)', type: 'text', default: '0101' },
      { key: 'event1Color', label: '颜色', type: 'color', default: '#ff6b6b' },
    ]},
    { group: '事件 2', fields: [
      { key: 'event2Name', label: '事件名', type: 'text', default: '春节' },
      { key: 'event2Date', label: '日期 (MMdd)', type: 'text', default: '0129' },
      { key: 'event2Color', label: '颜色', type: 'color', default: '#feca57' },
    ]},
    { group: '事件 3', fields: [
      { key: 'event3Name', label: '事件名', type: 'text', default: '国庆节' },
      { key: 'event3Date', label: '日期 (MMdd)', type: 'text', default: '1001' },
      { key: 'event3Color', label: '颜色', type: 'color', default: '#6c5ce7' },
    ]},
    { group: '样式', fields: [
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var events = [
      { name: c.event1Name || '新年', date: c.event1Date || '0101', color: c.event1Color },
      { name: c.event2Name || '春节', date: c.event2Date || '0129', color: c.event2Color },
      { name: c.event3Name || '国庆节', date: c.event3Date || '1001', color: c.event3Color },
    ].filter(function (e) { return /^\d{4}$/.test(e.date); });

    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Day" name="' + escXml(c.cardName || '倒数日') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="doy" type="number" expression="((#month - 1) * 31 + #date)" />');

    events.forEach(function (ev, i) {
      var mm = parseInt(ev.date.substring(0, 2));
      var dd = parseInt(ev.date.substring(2, 4));
      lines.push('  <Var name="target' + i + '" type="number" expression="' + ((mm - 1) * 31 + dd) + '" />');
      lines.push('  <Var name="diff' + i + '" type="number" expression="ifelse((#target' + i + ' >= #doy), (#target' + i + ' - #doy), (365 - #doy + #target' + i + '))" />');
    });

    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 倒数日列表 -->');
    lines.push('  <Group name="countdown_list" x="#marginL" y="16" w="' + safeW + '">');
    lines.push('    <Text text="📋 倒数日" x="0" y="0" size="16" color="' + c.textColor + '" bold="true" />');
    lines.push('    <Rectangle x="0" y="24" w="24" h="2" fillColor="' + (events[0] ? events[0].color : '#6c5ce7') + '" cornerRadius="1" />');

    events.forEach(function (ev, i) {
      var yBase = 40 + i * 72;
      lines.push('    <!-- ' + ev.name + ' -->');
      lines.push('    <Group name="event_' + i + '" x="0" y="' + yBase + '" w="' + safeW + '">');
      lines.push('      <Rectangle x="0" y="0" w="' + safeW + '" h="56" fillColor="#141418" cornerRadius="8" />');
      lines.push('      <Text text="' + escXml(ev.name) + '" x="12" y="10" size="14" color="' + c.textColor + '" />');
      lines.push('      <Text x="12" y="30" size="28" color="' + ev.color + '" textExp="#diff' + i + '" bold="true" fontFamily="mipro-demibold" />');
      lines.push('      <Text text="天" x="' + (12 + 28 * 2.2) + '" y="36" size="12" color="' + c.labelColor + '" alpha="0.5" />');
      lines.push('    </Group>');
    });

    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
