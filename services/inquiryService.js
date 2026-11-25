const inquiryRepository = require('../repositories/inquiryRepository');
const { validateInquiry, validateInquiryUpdate } = require('../utils/validators');
const { ValidationError, AppError } = require('../utils/errors');
const { inquiryStatuses } = require('../config/site');

async function createInquiry(body) {
  const { values, errors } = validateInquiry(body);
  if (Object.keys(errors).length) {
    const err = new ValidationError(errors);
    err.values = values;
    throw err;
  }
  return inquiryRepository.create(values);
}

async function list(filters) {
  return inquiryRepository.findAll(filters);
}

async function updateInquiry(id, body) {
  const { values, errors } = validateInquiryUpdate(body);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const updated = await inquiryRepository.updateStatusAndNotes(id, values);
  if (!updated) throw new AppError('Talep bulunamadı.', 404);
  return updated;
}

async function deleteInquiry(id) {
  const removed = await inquiryRepository.remove(id);
  if (!removed) throw new AppError('Talep bulunamadı.', 404);
}

async function getDashboardStats() {
  const [byStatus, recent] = await Promise.all([inquiryRepository.countByStatus(), inquiryRepository.findRecent(5)]);
  const counts = Object.fromEntries(inquiryStatuses.map((s) => [s, 0]));
  byStatus.forEach((row) => {
    counts[row.status] = row.count;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return {
    counts,
    total,
    newCount: counts['Yeni Talep'],
    ongoing: counts['Arandı'] + counts['Keşif Planlandı'] + counts['Teklif Sunuldu'],
    completed: counts['Tamamlandı'],
    recent
  };
}

module.exports = { createInquiry, list, updateInquiry, deleteInquiry, getDashboardStats };
