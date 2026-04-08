import { escXml } from '../maml.js';

export default {
  id: 'exchange_rate', icon: '💱', name: '汇率卡片', desc: '实时汇率显示',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '汇率卡片' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a1628' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '币种', fields: [
      { key: 'baseCurrency', label: '基准币种', type: 'text', default: 'USD' },
      { key: 'quoteCurrency', label: '目标币种', type: 'text', default: 'CNY' },
    ]},
    { group: '样式', fields: [
      { key: 'rateColor', label: '汇率颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
      { key: 'upColor', label: '上涨颜色', type: 'color', default: '#00b894' },
      { key: 'downColor', label: '下跌颜色', type: 'color', default: '#e74c3c' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#6c5ce7' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var base = escXml(c.baseCurrency || 'USD');
    var quote = escXml(c.quoteCurrency || 'CNY');
    var lines = [];

    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || '汇率卡片') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- 汇率数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="exchange_provider" uri="content://com.xiaomi.subscreencenter/exchange" columns="rate,change,update_time">');
    lines.push('      <Variable name="exchange_rate" type="float" column="rate" />');
    lines.push('      <Variable name="exchange_change" type="float" column="change" />');
    lines.push('      <Variable name="exchange_update" type="long" column="update_time" />');
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 汇率内容组 -->');
    lines.push('  <Group name="exchange_content" x="#marginL" y="20" w="' + safeW + '">');
    lines.push('    <Text text="💱 汇率" x="0" y="0" size="16" color="' + c.rateColor + '" bold="true" />');
    lines.push('    <!-- 币种对 -->');
    lines.push('    <Text text="' + base + '/' + quote + '" x="0" y="30" size="14" color="' + c.labelColor + '" />');
    lines.push('    <!-- 汇率数值 -->');
    lines.push('    <Text x="0" y="52" size="48" color="' + c.rateColor + '" textExp="round(#exchange_rate * 100) / 100" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <!-- 涨跌 -->');
    lines.push('    <Text x="0" y="114" size="14" color="ifelse((#exchange_change >= 0), ' + c.upColor + ', ' + c.downColor + ')" textExp="concat(ifelse((#exchange_change >= 0), \'▲ \', \'▼ \'), #exchange_change, \'%\')" />');
    lines.push('    <!-- 更新时间 -->');
    lines.push('    <Text x="0" y="146" size="11" color="' + c.labelColor + '" textExp="concat(\'更新: \', formatDate(\'HH:mm\', #exchange_update))" alpha="0.5" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
