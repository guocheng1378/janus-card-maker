import { generateAutoDetectMAML } from '../devices.js';

export default {
  id: 'composite', icon: '🏋️', name: '复合卡片', desc: '步数环 + 天气信息，一屏两用',
  updater: 'Step,DateTime.Hour,DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '复合卡片' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0e1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '步数环', fields: [
      { key: 'goal', label: '目标步数', type: 'text', default: '10000' },
      { key: 'demoSteps', label: '预览步数', type: 'range', min: 0, max: 20000, default: 6542 },
      { key: 'ringColor', label: '环颜色', type: 'color', default: '#6c5ce7' },
      { key: 'ringTrack', label: '轨道颜色', type: 'color', default: '#1a1f2e' },
      { key: 'ringSize', label: '环粗细', type: 'range', min: 4, max: 16, default: 8 },
    ]},
    { group: '天气', fields: [
      { key: 'city', label: '城市', type: 'text', default: '北京' },
      { key: 'tempColor', label: '温度颜色', type: 'color', default: '#ffffff' },
      { key: 'descColor', label: '描述颜色', type: 'color', default: '#888888' },
    ]},
    { group: '样式', fields: [
      { key: 'textColor', label: '数值颜色', type: 'color', default: '#ffffff' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#666666' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#00b894' },
    ]},
  ],
  gen(c) {
    var goalN = parseInt(c.goal) || 10000;
    var ringR = 60;
    var ringW = c.ringSize || 8;
    return [
      generateAutoDetectMAML(),
      '  <Var name="pct" type="number" expression="ifelse((#step_count > ' + goalN + '), 100, (#step_count * 100 / ' + goalN + '))" />',
      '  <Var name="ringR" type="number" expression="' + ringR + '" />',
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />',
      '',
      '  <!-- 步数环 (左半) -->',
      '  <Var name="ringCx" type="number" expression="(#marginL + (#view_width - #marginL) * 0.3)" />',
      '  <Circle x="#ringCx" y="110" r="#ringR" fillColor="' + c.ringTrack + '" />',
      '  <Circle x="#ringCx" y="110" r="(#ringR - ' + ringW + ')" fillColor="' + c.bgColor + '" />',
      '  <Text textExp="#step_count" x="(#ringCx - 50)" y="80" w="100" size="32" color="' + c.textColor + '" textAlign="center" bold="true" fontFamily="mipro-demibold" />',
      '  <Text text="步" x="(#ringCx - 10)" y="118" size="12" color="' + c.labelColor + '" />',
      '  <Text text="' + (c.city || '北京') + '" x="(#ringCx - 30)" y="194" w="60" size="11" color="' + c.labelColor + '" textAlign="center" alpha="0.6" />',
      '',
      '  <!-- 天气 (右半) -->',
      '  <Var name="weatherX" type="number" expression="(#marginL + (#view_width - #marginL) * 0.6)" />',
      '  <Text x="#weatherX" y="60" size="40" color="' + c.tempColor + '" textExp="#weather_temperature + \'°\'" bold="true" fontFamily="mipro-demibold" />',
      '  <Text x="#weatherX" y="108" size="14" color="' + c.descColor + '" textExp="#weather_description" fontFamily="mipro-normal" />',
      '  <Text x="#weatherX" y="132" size="12" color="' + c.descColor + '" textExp="\'最高 \' + #weather_temphigh[0] + \'°  最低 \' + #weather_templow[0] + \'°\'" alpha="0.5" fontFamily="mipro-normal" />',
      '',
      '  <!-- 分割线 -->',
      '  <Var name="divX" type="number" expression="(#marginL + (#view_width - #marginL) * 0.5)" />',
      '  <Rectangle x="#divX" y="40" w="1" h="160" fillColor="' + c.labelColor + '" alpha="0.1" />',
      '',
      '  <!-- 底部时间 -->',
      '  <DateTime x="#marginL" y="210" size="24" color="' + c.textColor + '" format="HH:mm" fontFamily="mipro-demibold" align="left" />',
      '  <DateTime x="(#marginL + 80)" y="214" size="12" color="' + c.descColor + '" format="MM/dd E" fontFamily="mipro-normal" align="left" />',
    ].join('\n');
  },
};
