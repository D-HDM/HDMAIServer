const STATUS_TTL_MS = 5 * 60 * 1000;
const statusMap = new Map();

const setStatus = (requestId, phase, meta = {}) => {
  if (!requestId) return;
  statusMap.set(requestId, { phase, ...meta, updatedAt: Date.now() });
};

const getStatus = (requestId) => {
  const entry = statusMap.get(requestId);
  if (!entry) return { phase: 'unknown' };
  if (Date.now() - entry.updatedAt > STATUS_TTL_MS) {
    statusMap.delete(requestId);
    return { phase: 'expired' };
  }
  return entry;
};

const clearStatus = (requestId) => statusMap.delete(requestId);

setInterval(() => {
  const cutoff = Date.now() - STATUS_TTL_MS;
  for (const [id, entry] of statusMap) {
    if (entry.updatedAt < cutoff) statusMap.delete(id);
  }
}, 60 * 1000).unref();

module.exports = { setStatus, getStatus, clearStatus };