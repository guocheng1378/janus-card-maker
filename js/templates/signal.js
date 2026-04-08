import { escXml } from '../maml.js';

export default {
  id: 'signal', icon: '📶', name: '信号状态', desc: 'SIM 信号强度 + 运营商',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '信号状态' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0e1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'titleColor', label: '标题颜色', type: 'color', default: '#ffffff' },
      { key: 'valueColor', label: '数值颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
      { key: 'goodColor', label: '良好颜色', type: 'color', default: '#00b894' },
      { key: 'weakColor', label: '较弱颜色', type: 'color', default: '#e74c3c' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '信号状态') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 信号数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="signal_provider" uri="content://com.android.phone/signal" columns="operator_name,signal_level,network_type,dbm">');
    lines.push('      <Variable name="operator_name" type="string" column="operator_name" />');
    lines.push('      <Variable name="signal_level" type="int" column="signal_level" />');
    lines.push('      <Variable name="network_type" type="string" column="network_type" />');
    lines.push('      <Variable name="signal_dbm" type="int" column="dbm" />');
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 信号内容组 -->');
    lines.push('  <Group name="signal_content" x="#marginL" y="20" w="' + safeW + '">');
    lines.push('    <Text text="📶 信号状态" x="0" y="0" size="16" color="' + c.titleColor + '" bold="true" />');
    lines.push('    <!-- 运营商 -->');
    lines.push('    <Text x="0" y="36" size="14" color="' + c.labelColor + '" textExp="@operator_name" />');
    lines.push('    <!-- 网络类型 -->');
    lines.push('    <Text x="0" y="58" size="28" color="' + c.valueColor + '" textExp="@network_type" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <!-- 信号强度条 -->');
    lines.push('    <Group name="signal_bars" x="0" y="100" w="' + safeW + '">');
    for (var i = 0; i < 4; i++) {
      var barH = 10 + i * 8;
      lines.push('      <Rectangle x="' + (i * 18) + '" y="' + (32 - barH) + '" w="12" h="' + barH + '" fillColor="ifelse((#signal_level > ' + i + '), ' + c.goodColor + ', #333333)" cornerRadius="2" />');
    }
    lines.push('    </Group>');
    lines.push('    <!-- dBm -->');
    lines.push('    <Text x="0" y="146" size="12" color="' + c.labelColor + '" textExp="concat(#signal_dbm, \' dBm\')" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
