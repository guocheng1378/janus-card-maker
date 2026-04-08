import { escXml } from '../maml.js';

export default {
  id: 'news', icon: '📰', name: '每日新闻', desc: 'RSS 头条 3 条',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '每日新闻' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0d1117' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '显示', fields: [
      { key: 'maxItems', label: '最大条数', type: 'range', min: 1, max: 5, default: 3 },
      { key: 'showTime', label: '显示时间', type: 'select', default: 'true', options: [{ v: 'true', l: '是' }, { v: 'false', l: '否' }]},
    ]},
    { group: '样式', fields: [
      { key: 'titleColor', label: '标题颜色', type: 'color', default: '#ffffff' },
      { key: 'itemColor', label: '条目颜色', type: 'color', default: '#cccccc' },
      { key: 'timeColor', label: '时间颜色', type: 'color', default: '#555555' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#e74c3c' },
      { key: 'numColor', label: '序号颜色', type: 'color', default: '#e74c3c' },
    ]},
  ],
  rawXml(c) {
    var maxI = c.maxItems || 3;
    var showTime = c.showTime !== 'false';
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || '每日新闻') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 新闻数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="news_provider" uri="content://com.xiaomi.subscreencenter/rss" columns="title,source,pub_time" sortOrder="pub_time DESC" limit="' + maxI + '">');
    for (var ri = 0; ri < maxI; ri++) {
      lines.push('      <Variable name="news_title_' + ri + '" type="string" column="title" />');
      lines.push('      <Variable name="news_source_' + ri + '" type="string" column="source" />');
      lines.push('      <Variable name="news_time_' + ri + '" type="long" column="pub_time" />');
    }
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 新闻内容组 -->');
    lines.push('  <Group name="news_content" x="#marginL" y="16" w="' + safeW + '">');
    lines.push('    <Text text="📰 头条" x="0" y="0" size="16" color="' + c.titleColor + '" bold="true" />');
    lines.push('    <Rectangle x="0" y="24" w="24" h="2" fillColor="' + c.accentColor + '" cornerRadius="1" />');

    for (var i = 0; i < maxI; i++) {
      var yBase = 36 + i * 64;
      lines.push('    <!-- 新闻 ' + (i + 1) + ' -->');
      lines.push('    <Group name="news_item_' + i + '" x="0" y="' + yBase + '" w="' + safeW + '">');
      lines.push('      <Text text="' + (i + 1) + '" x="0" y="2" size="20" color="' + c.numColor + '" bold="true" fontFamily="mipro-demibold" />');
      lines.push('      <Text x="24" y="0" size="13" color="' + c.itemColor + '" textExp="@news_title_' + i + '" w="(' + safeW + ' - 24)" multiLine="true" lineHeight="1.3" />');
      if (showTime) {
        lines.push('      <Text x="24" y="46" size="10" color="' + c.timeColor + '" textExp="@news_source_' + i + '" />');
      }
      lines.push('    </Group>');
    }
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
