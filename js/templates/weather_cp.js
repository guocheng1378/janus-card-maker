import { escXml } from '../maml.js';

export default {
  id: 'weather_cp', icon: '🌤️', name: '天气CP绑定', desc: '用 ContentProvider 直接绑定系统天气数据',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '天气卡片' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a1628' },
    ]},
    { group: '样式', fields: [
      { key: 'tempColor', label: '温度颜色', type: 'color', default: '#ffffff' },
      { key: 'descColor', label: '描述颜色', type: 'color', default: '#88aacc' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#4fc3f7' },
    ]},
  ],
  elements(c) {
    return [
      { type: 'rectangle', x: 0, y: 0, w: 976, h: 596, color: c.bgColor, locked: true },
      { type: 'text', text: '天气', x: 30, y: 40, size: 14, color: c.descColor, locked: true },
      { type: 'text', text: '24°C', x: 30, y: 70, size: 56, color: c.tempColor, bold: true, locked: false },
      { type: 'text', text: '多云 · 北京', x: 30, y: 140, size: 16, color: c.descColor, locked: false },
    ];
  },
  rawXml(c) {
    return [
      '<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || '天气卡片') + '">',
      '  <Var name="marginL" type="number" expression="(#view_width * 0.25)" />',
      '',
      '  <!-- ContentProvider 绑定天气数据 -->',
      '  <VariableBinders>',
      '    <ContentProvider uri="content://weather" sortOrder="date desc">',
      '      <Content name="temperature" column="temperature" />',
      '      <Content name="weather_desc" column="weatherDescription" />',
      '      <Content name="city" column="city" />',
      '      <Content name="humidity" column="humidity" />',
      '      <Content name="wind" column="windSpeed" />',
      '    </ContentProvider>',
      '  </VariableBinders>',
      '',
      '  <!-- 背景 -->',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <Group x="#marginL" y="0">',
      '    <!-- 标题 -->',
      '    <Text x="0" y="30" size="14" color="' + c.descColor + '" text="天气" />',
      '',
      '    <!-- 温度 -->',
      '    <Text x="0" y="60" size="56" color="' + c.tempColor + '" textExp="#temperature + &quot;°C&quot;" bold="true" fontFamily="mipro-demibold" />',
      '',
      '    <!-- 天气描述 + 城市 -->',
      '    <Text x="0" y="130" size="16" color="' + c.descColor + '" textExp="#weather_desc + &quot; · &quot; + #city" />',
      '',
      '    <!-- 分隔线 -->',
      '    <Rectangle x="0" y="158" w="40" h="2" fillColor="' + c.accentColor + '" cornerRadius="1" />',
      '',
      '    <!-- 湿度 -->',
      '    <Text x="0" y="174" size="12" color="' + c.descColor + '" textExp="&quot;湿度 &quot; + #humidity + &quot;%&quot;" />',
      '',
      '    <!-- 风速 -->',
      '    <Text x="0" y="196" size="12" color="' + c.descColor + '" textExp="&quot;风速 &quot; + #wind + &quot; km/h&quot;" />',
      '  </Group>',
      '</Widget>',
    ].join('\n');
  },
};
