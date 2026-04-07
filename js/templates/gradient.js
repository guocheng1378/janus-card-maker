import { generateAutoDetectMAML } from '../devices.js';

export default {
  id: 'gradient', icon: '🌈', name: '渐变文字卡片', desc: '渐变背景 + 居中文字',
  config: [
    { group: '基本', fields: [
      { key: 'cardName', label: '卡片名称', type: 'text', default: '渐变卡片' },
    ]},
    { group: '渐变', fields: [
      { key: 'bgColor1', label: '渐变色1', type: 'color', default: '#667eea' },
      { key: 'bgColor2', label: '渐变色2', type: 'color', default: '#764ba2' },
    ]},
    { group: '文字', fields: [
      { key: 'text', label: '文字', type: 'textarea', default: 'Hello\nWorld' },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'textSize', label: '字号', type: 'range', min: 16, max: 72, default: 36 },
    ]},
  ],
  elements(c) {
    var safeW = Math.round(976 * (1 - 0.3)) - 30;
    var textY = Math.round(596 * 0.3);
    return [
      { type: 'text', text: c.text, x: 10, y: textY, size: Number(c.textSize), color: c.textColor, multiLine: true, w: safeW, textAlign: 'center', lineHeight: 1.4, locked: false },
    ];
  },
  gen(c) {
    return [
      generateAutoDetectMAML(),
      '  <Rectangle w="#view_width" h="#view_height" fillColor="' + c.bgColor1 + '" />',
      '  <Rectangle x="(#view_width * 0.5)" w="(#view_width * 0.5)" h="#view_height" fillColor="' + c.bgColor2 + '" alpha="179" />',
    ].join('\n');
  },
};
