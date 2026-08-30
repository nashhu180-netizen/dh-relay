/** Classify an already-sanitized signal. Raw terminal output is deliberately not accepted. */
export function classifyQuota({ detectorId, signal, detectors = {} } = {}) {
  const detector = Object.prototype.hasOwnProperty.call(detectors, detectorId)
    ? detectors[detectorId]
    : null;
  if (!detector) return { classification: 'unknown', detector_id: detectorId ?? null };
  if (!signal || typeof signal !== 'object' || Array.isArray(signal)
    || !Number.isInteger(signal.http_status) || typeof signal.error_code !== 'string') {
    return { classification: 'unknown', detector_id: detectorId };
  }
  if (signal.http_status === detector.status && signal.error_code === detector.code) {
    return { classification: 'quota_confirmed', detector_id: detectorId };
  }
  return { classification: 'not_quota', detector_id: detectorId };
}
