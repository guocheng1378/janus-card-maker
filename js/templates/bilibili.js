import { escXml } from '../maml.js';

export default {
  id: 'bilibili', icon: '📺', name: 'B站订阅', desc: 'UP主粉丝数 + 最新视频',
  updater: 'DateTime.Hour',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: 'B站订阅' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
      { key: 'bgImage', label: '背景图 URL 或上传', type: 'text', default: '' },
    ]},
    { group: 'UP主', fields: [
      { key: 'upName', label: 'UP主名称', type: 'text', default: '某UP主' },
    ]},
    { group: '样式', fields: [
      { key: 'nameColor', label: '名称颜色', type: 'color', default: '#ffffff' },
      { key: 'countColor', label: '粉丝数颜色', type: 'color', default: '#fb7299' },
      { key: 'titleColor', label: '视频标题颜色', type: 'color', default: '#cccccc' },
      { key: 'labelColor', label: '标签颜色', type: 'color', default: '#888888' },
      { key: 'accentColor', label: '强调色', type: 'color', default: '#fb7299' },
    ]},
  ],
  rawXml(c) {
    var safeW = '(#view_width - #marginL - 40)';
    var lines = [];
    lines.push('<Widget screenWidth="976" frameRate="0" scaleByDensity="false" useVariableUpdater="DateTime.Hour" name="' + escXml(c.cardName || 'B站订阅') + '">');
    lines.push('  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />');
    lines.push('');
    lines.push('  <!-- B站数据绑定 -->');
    lines.push('  <VariableBinders>');
    lines.push('    <ContentProviderBinder name="bilibili_provider" uri="content://com.xiaomi.subscreencenter/bilibili" columns="up_name,follower_count,latest_title,latest_view,update_time">');
    lines.push('      <Variable name="bili_name" type="string" column="up_name" />');
    lines.push('      <Variable name="bili_followers" type="long" column="follower_count" />');
    lines.push('      <Variable name="bili_video_title" type="string" column="latest_title" />');
    lines.push('      <Variable name="bili_video_view" type="long" column="latest_view" />');
    lines.push('    </ContentProviderBinder>');
    lines.push('  </VariableBinders>');
    lines.push('');
    lines.push('  <!-- 背景 -->');
    lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor + '" />');
    lines.push('');
    lines.push('  <!-- B站内容组 -->');
    lines.push('  <Group name="bilibili_content" x="#marginL" y="20" w="' + safeW + '">');
    lines.push('    <Text text="📺 B站" x="0" y="0" size="16" color="' + c.nameColor + '" bold="true" />');
    lines.push('    <!-- UP主 -->');
    lines.push('    <Text x="0" y="30" size="14" color="' + c.labelColor + '" textExp="@bili_name" />');
    lines.push('    <!-- 粉丝数 -->');
    lines.push('    <Text x="0" y="50" size="36" color="' + c.countColor + '" textExp="ifelse((#bili_followers >= 10000), concat(round(#bili_followers / 10000 * 10) / 10, \'万\'), #bili_followers)" bold="true" fontFamily="mipro-demibold" />');
    lines.push('    <Text text="粉丝" x="0" y="92" size="12" color="' + c.labelColor + '" alpha="0.5" />');
    lines.push('    <!-- 分隔 -->');
    lines.push('    <Rectangle x="0" y="114" w="' + safeW + '" h="1" fillColor="#1a1a2e" />');
    lines.push('    <!-- 最新视频 -->');
    lines.push('    <Text text="最新视频" x="0" y="124" size="11" color="' + c.labelColor + '" alpha="0.6" />');
    lines.push('    <Text x="0" y="140" size="13" color="' + c.titleColor + '" textExp="@bili_video_title" w="' + safeW + '" multiLine="true" lineHeight="1.3" />');
    lines.push('    <Text x="0" y="180" size="11" color="' + c.labelColor + '" textExp="concat(#bili_video_view, \' 播放\')" alpha="0.5" />');
    lines.push('  </Group>');
    lines.push('</Widget>');

    return lines.join('\n');
  },
};
