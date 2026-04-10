// ─── Devices: 设备参数 ─────────────────────────────────────────────

export const DEVICES = {
  p2: { id: 'p2', label: 'Pro Max — 976×596', width: 976, height: 596, cameraZoneRatio: 0.30 },
};

export function getDevice(id) {
  return DEVICES[id] || DEVICES.p2;
}

export function cameraZoneWidth(device) {
  return Math.ceil(device.width * device.cameraZoneRatio);
}

export function generateAutoDetectMAML() {
  return [
    '  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />',
    '  <Var name="scaleX" type="number" expression="(#view_width / 976.0)" />',
    '  <Var name="scaleY" type="number" expression="(#view_height / 596.0)" />',
    '  <Var name="safeW" type="number" expression="(#view_width - #marginL - 20)" />',
  ].join("\n");
}
