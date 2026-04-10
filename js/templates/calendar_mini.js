import { escXml } from '../maml.js';

export default {
  id: 'calendar_mini', icon: '📅', name: '月历', desc: '当月日历 + 事件标记',
  updater: 'DateTime.Day',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '月历' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
    ]},
    { group: '事件', fields: [
      { key: 'eventDate1', label: '事件1 日期 (MM-DD)', type: 'text', default: '' },
      { key: 'eventLabel1', label: '事件1 名称', type: 'text', default: '' },
      { key: 'eventDate2', label: '事件2 日期 (MM-DD)', type: 'text', default: '' },
      { key: 'eventLabel2', label: '事件2 名称', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'titleColor', label: '标题颜色', type: 'color', default: '#ffffff' },
      { key: 'dayColor', label: '日期颜色', type: 'color', default: '#aaaaaa' },
      { key: 'todayColor', label: '今日高亮', type: 'color', default: '#4fc3f7' },
      { key: 'weekendColor', label: '周末颜色', type: 'color', default: '#ff6b6b' },
      { key: 'eventColor', label: '事件标记颜色', type: 'color', default: '#ffd700' },
      { key: 'inactiveColor', label: '非本月颜色', type: 'color', default: '#333333' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', text: '📅 2026年4月', x: 30, y: 30, size: 16, color: c.titleColor, bold: true },
      { type: 'text', text: '日  一  二  三  四  五  六', x: 30, y: 60, size: 12, color: c.dayColor },
      { type: 'text', text: '          1   2   3   4', x: 30, y: 82, size: 12, color: c.dayColor },
      { type: 'text', text: '5   6   7   8   9  10  11', x: 30, y: 104, size: 12, color: c.dayColor },
      { type: 'text', text: '12  13  14  15  16  17  18', x: 30, y: 126, size: 12, color: c.dayColor },
      { type: 'text', text: '19  20  21  22  23  24  25', x: 30, y: 148, size: 12, color: c.dayColor },
      { type: 'text', text: '26  27  28  29  30', x: 30, y: 170, size: 12, color: c.dayColor },
      { type: 'rectangle', x: 30, y: 195, w: 250, h: 1, color: '#333333' },
      { type: 'text', text: '📌 本周事件', x: 30, y: 215, size: 13, color: c.titleColor },
      { type: 'text', text: '• 周五 团建活动', x: 30, y: 240, size: 12, color: c.eventColor },
    ];
  },
  rawXml(c) {
    var e1d = escXml(c.eventDate1 || '');
    var e1l = escXml(c.eventLabel1 || '');
    var e2d = escXml(c.eventDate2 || '');
    var e2l = escXml(c.eventLabel2 || '');
    var eventLines = '';
    if (e1d && e1l) {
      eventLines += '    <Text x="0" y="240" size="12" color="' + c.eventColor + '" text="• ' + e1d + ' ' + e1l + '" />\n';
    }
    if (e2d && e2l) {
      eventLines += '    <Text x="0" y="262" size="12" color="' + c.eventColor + '" text="• ' + e2d + ' ' + e2l + '" />\n';
    }
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Day" name="' + escXml(c.cardName || '月历') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '  <Var name="curYear" type="number" expression="year(#time_sys)" />',
      '  <Var name="curMonth" type="number" expression="month(#time_sys)" />',
      '  <Var name="curDay" type="number" expression="dayOfMonth(#time_sys)" />',
      '  <Var name="firstDow" type="number" expression="dayOfWeek(#time_sys - (#curDay - 1) * 86400000)" />',
      '  <Var name="daysInMonth" type="number" expression="daysInMonth(#curYear, #curMonth)" />',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <Group x="#marginL" y="0">',
      '    <!-- 月份标题 -->',
      '    <Text x="0" y="20" size="16" color="' + c.titleColor + '" textExp="#curYear + &quot;年&quot; + #curMonth + &quot;月&quot;" bold="true" />',
      '',
      '    <!-- 星期头 -->',
      '    <Text x="0" y="50" size="12" color="' + c.dayColor + '" text="日  一  二  三  四  五  六" />',
      '',
      '    <!-- 日历网格 -->',
      '    <CalendarGrid x="0" y="72" cellSize="36" fontSize="12"',
      '      todayColor="' + c.todayColor + '"',
      '      dayColor="' + c.dayColor + '"',
      '      weekendColor="' + c.weekendColor + '"',
      '      inactiveColor="' + c.inactiveColor + '"',
      '      eventColor="' + c.eventColor + '"',
      '    />',
      '',
      '    <!-- 分隔线 -->',
      '    <Rectangle x="0" y="195" w="250" h="1" fillColor="#333333" />',
      '',
      '    <!-- 事件标题 -->',
      '    <Text x="0" y="215" size="13" color="' + c.titleColor + '" text="📌 事件" />',
      '',
      '    <!-- 自定义事件 -->',
      eventLines +
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
