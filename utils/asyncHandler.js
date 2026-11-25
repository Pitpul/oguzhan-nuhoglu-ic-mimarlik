/** Express 4'te async controller hatalarını merkezi error middleware'e iletir. */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
