import { escXml } from '../maml.js';

export default {
  id: 'quote_carousel', icon: '📜', name: '语录轮播', desc: '多条名言定时切换',
  updater: 'DateTime.Minute',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '语录轮播' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: '语录', fields: [
      { key: 'interval', label: '切换间隔(秒)', type: 'range', min: 3, max: 30, default: 8 },
      { key: 'quote1', label: '语录 1', type: 'textarea', default: 'The only way to do great work\nis to love what you do.' },
      { key: 'quote2', label: '语录 2', type: 'textarea', default: 'Innovation distinguishes\nbetween a leader\nand a follower.' },
      { key: 'quote3', label: '语录 3', type: 'textarea', default: 'Stay hungry. Stay foolish.' },
      { key: 'quote4', label: '语录 4', type: 'textarea', default: '' },
      { key: 'quote5', label: '语录 5', type: 'textarea', default: '' },
    ]},
    { group: '样式', fields: [
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'textSize', label: '字号', type: 'range', min: 16, max: 48, default: 24 },
      { key: 'authorColor', label: '作者/指示器颜色', type: 'color', default: '#6c5ce7' },
      { key: 'showDots', label: '显示指示点', type: 'select', default: 'true', options: [
        { v: 'true', l: '是' }, { v: 'false', l: '否' },
      ]},
    ]},
  ],
  rawXml(c) {
    var quotes = [c.quote1, c.quote2, c.quote3, c.quote4, c.quote5].filter(Boolean);
    if (quotes.length === 0) quotes = ['Stay hungry. Stay foolish.'];
    var interval = (c.interval || 8) * 1000;
    var ts = Number(c.textSize) || 24;
    var safeW = '(#view_width - #marginL - 40)';
    var textY = Math.round(596 * 0.25);

    // Build expression
    var textExpr = "'" + escXml(quotes[quotes.length - 1]).replace(/\n/g, '\\n') + "'";
    for (var i = quotes.length - 2; i >= 0; i--) {
      textExpr = "ifelse((#slideIdx == " + i + "), '" + escXml(quotes[i]).replace(/\n/g, '\\n') + "', " + textExpr + ")";
    }

    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Minute" name="' + escXml(c.cardName || '语录轮播') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('  <Var name="slideIdx" type="number" expression="mod(floor(div(#time_sys, ' + interval + ')), ' + quotes.length + ')" />');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- 语录内容组 -->');
    lines.push('  <Group name="quote_content" x="#marginL" y="0" w="' + safeW + '">');
    lines.push('    <Rectangle x="0" y="' + (textY - 10) + '" w="3" h="40" fillColor="' + c.authorColor + '" cornerRadius="1.5" />');
    lines.push('    <Text x="16" y="' + textY + '" size="' + ts + '" color="' + c.textColor + '" textExp="' + textExpr + '" w="' + safeW + '" multiLine="true" lineHeight="1.5" />');

    if (c.showDots !== 'false') {
      lines.push('    <!-- 指示点 -->');
      lines.push('    <Group name="dots" x="((' + safeW + ' - ' + (quotes.length * 14) + ') / 2)" y="(#view_height - 40)">');
      for (var j = 0; j < quotes.length; j++) {
        lines.push('      <Circle x="' + (j * 14 + 4) + '" y="4" r="3" fillColor="' + c.authorColor + '" alpha="ifelse(eq(#slideIdx, ' + j + '), 1, 0.3)" />');
      }
      lines.push('    </Group>');
    }
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
