// ─── Devices: 设备参数 ─────────────────────────────────────────────

JCM.DEVICES = {
  q200: { id: 'q200', label: 'Pro — 904×572',    width: 904, height: 572, cameraZoneRatio: 0.30 },
  p2:   { id: 'p2',   label: 'Pro Max — 976×596', width: 976, height: 596, cameraZoneRatio: 0.30 },
};

JCM.getDevice = function (id) {
  return JCM.DEVICES[id] || JCM.DEVICES.q200;
};

JCM.cameraZoneWidth = function (device) {
  return Math.ceil(device.width * device.cameraZoneRatio);
};
