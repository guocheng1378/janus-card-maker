import { escXml } from '../maml.js';

export default {
  id: 'hitokoto', icon: '💬', name: '一言', desc: '随机语录 (Hitokoto)',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '一言' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a1a2e' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'textSize', label: '字号', type: 'range', min: 14, max: 48, default: 22 },
      { key: 'authorColor', label: '来源颜色', type: 'color', default: '#6c5ce7' },
    ]},
  ],
  rawXml(c) {
    var ts = Number(c.textSize) || 22;
    var safeW = '(#view_width - #marginL - 40)';
    var textY = Math.round(596 * 0.3);
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || '一言') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 一言数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="hitokoto_provider" uri="content://com.xiaomi.subscreencenter/hitokoto" columns="hitokoto,from_who,from">');
    lines.push('      <Variable name="hitokoto_text" type="string" column="hitokoto" />');
    lines.push('      <Variable name="hitokoto_author" type="string" column="from_who" />');
    lines.push('      <Variable name="hitokoto_source" type="string" column="from" />');
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 一言内容组 -->');
    lines.push('  <Group name="hitokoto_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <!-- 引用标记 -->');
    lines.push('    <Rectangle x="0" y="' + (textY - 8) + '" w="3" h="40" fillColor="' + c.authorColor + '" cornerRadius="1.5" />');
    lines.push('    <!-- 一言文字 -->');
    lines.push('    <Text x="14" y="' + textY + '" size="' + ts + '" color="' + c.textColor + '" textExp="ifelse(eq(@hitokoto_text, \'\'), \'加载中...\', @hitokoto_text)" w="' + safeW + '" multiLine="true" lineHeight="1.5" />');
    lines.push('    <!-- 来源 -->');
    lines.push('    <Text x="14" y="(#view_height - 80)" size="14" color="' + c.authorColor + '" textExp="concat(\'── \', ifelse(eq(@hitokoto_author, \'\'), \'\', concat(@hitokoto_author, \' · \')), @hitokoto_source)" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
