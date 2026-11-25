const projectService = require('../services/projectService');
const { projectCategories } = require('../config/site');
const { setFlash } = require('../utils/flash');
const { ValidationError } = require('../utils/errors');
const { site } = require('../config/site');
const { truncate, absUrl } = require('../utils/viewHelpers');
const config = require('../config/env');

const CATEGORY_VALUES = projectCategories.map((c) => c.value);

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

async function list(req, res) {
  const projects = await projectService.listPublic();
  const counts = { all: projects.length };
  projectCategories.forEach((c) => {
    counts[c.value] = projects.filter((p) => p.category === c.value).length;
  });
  const initial = CATEGORY_VALUES.includes(req.query.kategori) ? req.query.kategori : 'all';
  res.render('pages/projeler', {
    currentPage: 'projects',
    meta: {
      title: `Seçkin Projeler & Mimari Portfolyo | ${site.name}`,
      description:
        'Konut, villa, penthouse, loft ve ticari alan projelerinden oluşan seçkin iç mimari portfolyomuzu inceleyin.',
      path: '/projeler'
    },
    projects,
    counts,
    initialFilter: initial
  });
}

async function detail(req, res, next) {
  const { slug } = req.params;
  if (/^\d+$/.test(slug)) {
    const byId = await projectService.getById(parseInt(slug, 10));
    if (byId) return res.redirect(301, `/projeler/${byId.slug}`);
  }
  const project = await projectService.getBySlug(slug);
  if (!project) return next(); // 404

  const all = await projectService.listPublic();
  const related = all.filter((p) => p.id !== project.id).slice(0, 3);
  return res.render('pages/proje-detay', {
    currentPage: 'projects',
    meta: {
      title: `${project.title} | ${site.name}`,
      description: truncate(project.description, 155),
      path: `/projeler/${project.slug}`,
      image: project.image_url ? absUrl(project.image_url) : undefined,
      ogType: 'article'
    },
    project,
    related
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function adminList(req, res) {
  const search = (req.query.q || '').toString().trim().slice(0, 100);
  const category = CATEGORY_VALUES.includes(req.query.category) ? req.query.category : '';
  const projects = await projectService.listAdmin({ search, category });
  res.render('admin/projects', {
    meta: { title: 'Projeler | Yönetim Paneli', noindex: true },
    adminPage: 'projects',
    projects,
    filters: { q: search, category },
    maxFeatured: config.maxFeaturedProjects
  });
}

function renderForm(res, { project, errors = {}, isEdit = false, status = 200, formError = null }) {
  return projectService
    .listAdmin({})
    .then((all) => {
      const featuredCount = all.filter((p) => p.is_featured && (!isEdit || p.id !== project.id)).length;
      res.status(status).render('admin/project-form', {
        meta: { title: `${isEdit ? 'Projeyi Düzenle' : 'Yeni Proje'} | Yönetim Paneli`, noindex: true },
        adminPage: 'projects',
        project,
        errors,
        isEdit,
        formError,
        featuredCount,
        maxFeatured: config.maxFeaturedProjects
      });
    });
}

function newForm(req, res) {
  return renderForm(res, { project: { category: 'konut', is_featured: false } });
}

async function editForm(req, res, next) {
  const project = await projectService.getById(parseInt(req.params.id, 10));
  if (!project) return next();
  return renderForm(res, { project, isEdit: true });
}

async function adminCreate(req, res) {
  if (req.uploadError) {
    return renderForm(res, { project: req.body, errors: { image_file: req.uploadError }, status: 400 });
  }
  try {
    const created = await projectService.createProject(req.body, req.file);
    setFlash(req, 'success', `"${created.title}" projesi eklendi.`);
    return res.redirect('/admin/projeler');
  } catch (err) {
    if (err instanceof ValidationError) {
      return renderForm(res, { project: err.values || req.body, errors: err.fieldErrors, status: 400 });
    }
    if (err.status === 400) {
      return renderForm(res, { project: req.body, errors: { image_file: err.message }, status: 400 });
    }
    throw err;
  }
}

async function adminUpdate(req, res) {
  const id = parseInt(req.params.id, 10);
  const asEditing = (p) => ({ ...p, id });
  if (req.uploadError) {
    return renderForm(res, { project: asEditing(req.body), errors: { image_file: req.uploadError }, isEdit: true, status: 400 });
  }
  try {
    const updated = await projectService.updateProject(id, req.body, req.file);
    setFlash(req, 'success', `"${updated.title}" projesi güncellendi.`);
    return res.redirect('/admin/projeler');
  } catch (err) {
    if (err instanceof ValidationError) {
      return renderForm(res, { project: asEditing(err.values || req.body), errors: err.fieldErrors, isEdit: true, status: 400 });
    }
    if (err.status === 400) {
      return renderForm(res, { project: asEditing(req.body), errors: { image_file: err.message }, isEdit: true, status: 400 });
    }
    throw err;
  }
}

async function adminToggleFeatured(req, res) {
  const id = parseInt(req.params.id, 10);
  try {
    const updated = await projectService.toggleFeatured(id);
    setFlash(
      req,
      'success',
      updated.is_featured
        ? `"${updated.title}" ana sayfada öne çıkarıldı.`
        : `"${updated.title}" öne çıkanlardan kaldırıldı.`
    );
  } catch (err) {
    if (err instanceof ValidationError) {
      setFlash(req, 'error', err.message);
    } else {
      throw err;
    }
  }
  return res.redirect('/admin/projeler');
}

async function adminDelete(req, res) {
  const removed = await projectService.deleteProject(parseInt(req.params.id, 10));
  setFlash(req, 'success', `"${removed.title}" projesi silindi.`);
  res.redirect('/admin/projeler');
}

module.exports = {
  list,
  detail,
  adminList,
  newForm,
  editForm,
  adminCreate,
  adminUpdate,
  adminToggleFeatured,
  adminDelete
};
