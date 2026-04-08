import { escXml } from '../maml.js';

export default {
  id: 'storage', icon: '💾', name: '存储空间', desc: '内存/存储占用环形图',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '存储空间' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'usedColor', label: '已用颜色', type: 'color', default: '#e74c3c' },
      { key: 'freeColor', label: '可用颜色', type: 'color', default: '#00b894' },
      { key: 'trackColor', label: '轨道颜色', type: 'color', default: '#222233' },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || '存储空间') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 存储数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="storage_provider" uri="content://com.android.externalstorage/stat" columns="total_bytes,used_bytes,avail_bytes">');
    lines.push('      <Variable name="storage_total" type="long" column="total_bytes" />');
    lines.push('      <Variable name="storage_used" type="long" column="used_bytes" />');
    lines.push('      <Variable name="storage_avail" type="long" column="avail_bytes" />');
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 存储内容组 -->');
    lines.push('  <Group name="storage_content" x="#marginL" y="20" w="' + safeW + '">');
    lines.push('    <Text text="💾 存储空间" x="0" y="0" size="16" color="' + c.textColor + '" bold="true" />');
    lines.push('    <!-- 存储条 -->');
    lines.push('    <Group name="storage_bar" x="0" y="40" w="' + safeW + '">');
    lines.push('      <Rectangle x="0" y="0" w="' + safeW + '" h="12" fillColor="' + c.trackColor + '" cornerRadius="6" />');
    lines.push('      <Rectangle x="0" y="0" w="((' + safeW + ') * #storage_used / #storage_total)" h="12" fillColor="' + c.usedColor + '" cornerRadius="6" />');
    lines.push('    </Group>');
    lines.push('    <!-- 容量文字 -->');
    lines.push('    <Text x="0" y="62" size="12" color="' + c.labelColor + '" textExp="concat(\'已用 \', round(#storage_used / 1073741824), \'GB / \', round(#storage_total / 1073741824), \'GB\')" />');
    lines.push('    <!-- 详情 -->');
    lines.push('    <Group name="details" x="0" y="90" w="' + safeW + '">');
    lines.push('      <Text text="已用" x="0" y="0" size="12" color="' + c.labelColor + '" />');
    lines.push('      <Text x="0" y="16" size="24" color="' + c.usedColor + '" textExp="concat(round(#storage_used / 1073741824 * 10) / 10, \' GB\')" bold="true" />');
    lines.push('      <Text text="可用" x="((' + safeW + ') / 2)" y="0" size="12" color="' + c.labelColor + '" />');
    lines.push('      <Text x="((' + safeW + ') / 2)" y="16" size="24" color="' + c.freeColor + '" textExp="concat(round(#storage_avail / 1073741824 * 10) / 10, \' GB\')" bold="true" />');
    lines.push('    </Group>');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
