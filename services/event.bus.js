/**
 * 📡 SIMPLE EVENT BUS (PRODUCTION READY FOUNDATION)
 * Later upgrade → Kafka / Redis Streams / Webhooks
 */

const listeners = {};

function on(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
}

function emit(event, data) {
  const subs = listeners[event] || [];
  subs.forEach(fn => {
    try {
      fn(data);
    } catch (err) {
      console.error("EVENT ERROR:", err.message);
    }
  });
}

module.exports = {
  on,
  emit
};
