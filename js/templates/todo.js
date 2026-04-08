import { escXml } from '../maml.js';

export default {
  id: 'todo', icon: '✅', name: '待办清单', desc: '绑定系统提醒事项',
  updater: 'DateTime.Hour,DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '待办清单' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0d1117' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '显示', fields: [
      { key: 'maxItems', label: '最大条数', type: 'range', min: 1, max: 8, default: 5 },
    ]},
    { group: '样式', fields: [
      { key: 'titleColor', label: '标题颜色', type: 'color', default: '#ffffff' },
      { key: 'itemColor', label: '条目颜色', type: 'color', default: '#cccccc' },
      { key: 'doneColor', label: '已完成颜色', type: 'color', default: '#555555' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#00b894' },
      { key: 'checkColor', label: '勾选颜色', type: 'color', default: '#00b894' },
    ]},
  ],
  rawXml(c) {
    var maxI = c.maxItems || 5;
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour,DateTime.Minute" name="' + escXml(c.cardName || '待办清单') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 提醒事项数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="reminder_provider" uri="content://com.android.calendar/reminders" columns="title,dtstart,status" sortOrder="dtstart ASC" limit="' + maxI + '">');
    for (var ri = 0; ri < maxI; ri++) {
      lines.push('      <Variable name="todo_title_' + ri + '" type="string" column="title" />');
      lines.push('      <Variable name="todo_status_' + ri + '" type="int" column="status" />');
    }
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 待办内容组 -->');
    lines.push('  <Group name="todo_content" x="#marginL" y="16" w="' + safeW + '">');
    lines.push('    <Text text="✅ 待办" x="0" y="0" size="16" color="' + c.titleColor + '" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <Rectangle x="0" y="24" w="24" h="2" fillColor="' + c.accentColor + '" cornerRadius="1" />');

    for (var i = 0; i < maxI; i++) {
      var yBase = 36 + i * 40;
      lines.push('    <!-- 待办 ' + (i + 1) + ' -->');
      lines.push('    <Group name="todo_item_' + i + '" x="0" y="' + yBase + '" w="' + safeW + '">');
      lines.push('      <Circle x="6" y="8" r="5" fillColor="ifelse(eq(#todo_status_' + i + ', 1), ' + c.checkColor + ', #333333)" />');
      lines.push('      <Text x="18" y="0" size="13" color="ifelse(eq(#todo_status_' + i + ', 1), ' + c.doneColor + ', ' + c.itemColor + ')" textExp="@todo_title_' + i + '" w="(' + safeW + ' - 18)" ellipsis="true" />');
      lines.push('    </Group>');
    }
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
