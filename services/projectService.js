const config = require('../config/env');
const { projectCategories } = require('../config/site');
const projectRepository = require('../repositories/projectRepository');
const uploadService = require('./uploadService');
const { validateProject } = require('../utils/validators');
const { ValidationError, AppError } = require('../utils/errors');
const { slugify } = require('../utils/slugify');

const DEFAULT_ARCHITECT = 'Oğuzhan Nuhoğlu & İç Mimari Atölyesi';

function categoryLabel(category) {
  const found = projectCategories.find((c) => c.value === category);
  return found ? found.label : category;
}

async function uniqueSlug(title, excludeId = null) {
  const base = slugify(title);
  let candidate = base;
  let counter = 2;
  while (await projectRepository.slugExists(candidate, excludeId)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

/** Ana sayfada en fazla N proje öne çıkarılabilir — kural backend'de de uygulanır. */
async function assertFeaturedLimit(isFeatured, excludeId = null) {
  if (!isFeatured) return;
  const current = await projectRepository.countFeatured(excludeId);
  if (current >= config.maxFeaturedProjects) {
    throw new ValidationError(
      { is_featured: `Ana sayfada en fazla ${config.maxFeaturedProjects} proje öne çıkarılabilir. Önce başka bir projenin öne çıkarmasını kaldırın.` }
    );
  }
}

function validationFailure(errors, values) {
  const err = new ValidationError(errors);
  err.values = values;
  return err;
}

async function listPublic() {
  return projectRepository.findAll();
}

async function listFeatured() {
  return projectRepository.findFeatured(config.maxFeaturedProjects);
}

async function listAdmin(filters) {
  return projectRepository.findAll(filters);
}

async function getBySlug(slug) {
  return projectRepository.findBySlug(slug);
}

async function getById(id) {
  return projectRepository.findById(id);
}

async function createProject(body, file) {
  const { values, errors } = validateProject(body);
  if (!file && !values.image_url) errors.image_url = 'Lütfen bir görsel yükleyin veya görsel adresi girin.';
  if (Object.keys(errors).length) throw validationFailure(errors, values);

  try {
    await assertFeaturedLimit(values.is_featured);
  } catch (err) {
    err.values = values;
    throw err;
  }

  let uploadedUrl = null;
  if (file) uploadedUrl = await uploadService.saveImage(file);

  try {
    return await projectRepository.create({
      ...values,
      slug: await uniqueSlug(values.title),
      category_label: categoryLabel(values.category),
      architect: values.architect || DEFAULT_ARCHITECT,
      image_url: uploadedUrl || values.image_url
    });
  } catch (err) {
    if (uploadedUrl) await uploadService.deleteImage(uploadedUrl);
    throw err;
  }
}

async function updateProject(id, body, file) {
  const existing = await projectRepository.findById(id);
  if (!existing) throw new AppError('Düzenlenecek proje bulunamadı.', 404);

  const { values, errors } = validateProject(body);
  if (Object.keys(errors).length) throw validationFailure(errors, values);

  try {
    await assertFeaturedLimit(values.is_featured, id);
  } catch (err) {
    err.values = values;
    throw err;
  }

  let uploadedUrl = null;
  if (file) uploadedUrl = await uploadService.saveImage(file);
  const newImageUrl = uploadedUrl || values.image_url || existing.image_url;

  let updated;
  try {
    updated = await projectRepository.update(id, {
      ...values,
      slug: existing.slug || (await uniqueSlug(values.title, id)),
      category_label: categoryLabel(values.category),
      architect: values.architect || DEFAULT_ARCHITECT,
      image_url: newImageUrl
    });
  } catch (err) {
    if (uploadedUrl) await uploadService.deleteImage(uploadedUrl);
    throw err;
  }

  // Görsel değiştiyse eski yerel dosyayı, başka proje kullanmıyorsa temizle.
  if (existing.image_url && existing.image_url !== newImageUrl) {
    await cleanupImageIfUnused(existing.image_url);
  }
  return updated;
}

async function cleanupImageIfUnused(imageUrl) {
  if (!uploadService.isManagedImage(imageUrl)) return;
  const usage = await projectRepository.countImageUsage(imageUrl);
  if (usage === 0) await uploadService.deleteImage(imageUrl);
}

async function toggleFeatured(id) {
  const existing = await projectRepository.findById(id);
  if (!existing) throw new AppError('Proje bulunamadı.', 404);
  const nextFeatured = !existing.is_featured;
  await assertFeaturedLimit(nextFeatured, id);
  return projectRepository.update(id, {
    ...existing,
    is_featured: nextFeatured
  });
}

async function deleteProject(id) {
  const existing = await projectRepository.findById(id);
  if (!existing) throw new AppError('Silinecek proje bulunamadı.', 404);
  await projectRepository.remove(id);
  await cleanupImageIfUnused(existing.image_url);
  return existing;
}

async function getDashboardStats() {
  const [total, featured, byCategory] = await Promise.all([
    projectRepository.countAll(),
    projectRepository.countFeatured(),
    projectRepository.countByCategory()
  ]);
  return { total, featured, byCategory };
}

module.exports = {
  listPublic,
  listFeatured,
  listAdmin,
  getBySlug,
  getById,
  createProject,
  updateProject,
  toggleFeatured,
  deleteProject,
  getDashboardStats,
  categoryLabel
};
