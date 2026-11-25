/** İstek gövdesini bir doğrulayıcıyla kontrol eden yardımcı middleware'ler. */

function wantsJson(req) {
  return req.xhr || (req.get('accept') || '').includes('application/json');
}

/**
 * validator(body) => { values, errors }
 * Geçerliyse req.validated = values olur. Geçersizse:
 *  - JSON isteklerine 400 + alan hataları döner,
 *  - diğerlerinde req.validation set edilir ve onInvalid(req,res) çağrılır.
 */
function validateBody(validator, onInvalid) {
  return (req, res, next) => {
    const { values, errors } = validator(req.body);
    if (Object.keys(errors).length === 0) {
      req.validated = values;
      return next();
    }
    if (wantsJson(req)) {
      return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
    }
    req.validation = { values, errors };
    return onInvalid(req, res, next);
  };
}

module.exports = { validateBody, wantsJson };
