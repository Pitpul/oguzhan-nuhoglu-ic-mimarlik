/** Uygulama içinde kontrollü olarak fırlatılan hatalar. */
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.expose = status < 500; // Kullanıcıya gösterilebilir mi?
  }
}

/** Alan bazlı doğrulama hatalarını taşır: { field: 'mesaj' } */
class ValidationError extends AppError {
  constructor(fieldErrors, message) {
    const first = Object.values(fieldErrors)[0];
    super(message || first || 'Geçersiz veri.', 400);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

module.exports = { AppError, ValidationError };
