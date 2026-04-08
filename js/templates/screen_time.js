import { escXml } from '../maml.js';

export default {
  id: 'screen_time', icon: '📱', name: '屏幕时间', desc: '今日亮屏时长 + 使用统计',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '屏幕时间' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a1628' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'titleColor', label: '标题颜色', type: 'color', default: '#ffffff' },
      { key: 'timeColor', label: '时间颜色', type: 'color', default: '#ffffff' },
      { key: 'barColor', label: '条形图颜色', type: 'color', default: '#6c5ce7' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#6c5ce7' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || '屏幕时间') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 使用数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="usage_provider" uri="content://com.android.usagestats/daily" columns="total_time,app1_name,app1_time,app2_name,app2_time,app3_name,app3_time,unlock_count">');
    lines.push('      <Variable name="screen_total" type="long" column="total_time" />');
    lines.push('      <Variable name="app1_name" type="string" column="app1_name" />');
    lines.push('      <Variable name="app1_time" type="long" column="app1_time" />');
    lines.push('      <Variable name="app2_name" type="string" column="app2_name" />');
    lines.push('      <Variable name="app2_time" type="long" column="app2_time" />');
    lines.push('      <Variable name="app3_name" type="string" column="app3_name" />');
    lines.push('      <Variable name="app3_time" type="long" column="app3_time" />');
    lines.push('      <Variable name="unlock_count" type="int" column="unlock_count" />');
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 屏幕时间内容组 -->');
    lines.push('  <Group name="screen_time_content" x="#marginL" y="20" w="' + safeW + '">');
    lines.push('    <Text text="📱 今日屏幕时间" x="0" y="0" size="16" color="' + c.titleColor + '" bold="true" />');
    lines.push('    <Rectangle x="0" y="24" w="30" h="2" fillColor="' + c.accentColor + '" cornerRadius="1" />');
    lines.push('    <!-- 总时长 -->');
    lines.push('    <Text x="0" y="40" size="42" color="' + c.timeColor + '" textExp="concat(floor(#screen_total / 3600000), \'h\', floor(mod(#screen_total, 3600000) / 60000), \'m\')" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <Text x="0" y="92" size="12" color="' + c.labelColor + '" textExp="concat(\'解锁 \', #unlock_count, \' 次\')" />');
    lines.push('    <!-- 分隔 -->');
    lines.push('    <Rectangle x="0" y="112" w="' + safeW + '" h="1" fillColor="#1a2040" />');
    lines.push('    <!-- App 使用排名 -->');
    lines.push('    <Group name="app_usage" x="0" y="122" w="' + safeW + '">');
    lines.push('      <Text text="@app1_name" x="0" y="0" size="12" color="' + c.labelColor + '" />');
    lines.push('      <Rectangle x="0" y="16" w="((' + safeW + ') * #app1_time / #screen_total)" h="6" fillColor="' + c.barColor + '" cornerRadius="3" />');
    lines.push('      <Text text="@app2_name" x="0" y="36" size="12" color="' + c.labelColor + '" />');
    lines.push('      <Rectangle x="0" y="52" w="((' + safeW + ') * #app2_time / #screen_total)" h="6" fillColor="' + c.barColor + '" alpha="0.7" cornerRadius="3" />');
    lines.push('      <Text text="@app3_name" x="0" y="72" size="12" color="' + c.labelColor + '" />');
    lines.push('      <Rectangle x="0" y="88" w="((' + safeW + ') * #app3_time / #screen_total)" h="6" fillColor="' + c.barColor + '" alpha="0.4" cornerRadius="3" />');
    lines.push('    </Group>');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
