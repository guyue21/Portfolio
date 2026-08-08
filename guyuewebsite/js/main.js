// ========================================
// NAV
// ========================================
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const mobileMenu= document.getElementById('mobileMenu');

window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));

navToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.querySelectorAll('.menu-link').forEach(l => l.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  navToggle.classList.remove('open');
  document.body.style.overflow = '';
}));

// ========================================
// WORK FILTER (Dynamic)
// ========================================
const filterContainer = document.getElementById('filter');
const workGrid   = document.getElementById('workGrid');

// 映射分类到中文标签
const categoryLabels = {
  'graphic': '平面设计',
  'ui': 'UI / 产品',
  'painting': '绘画',
  'animation': '动画 / 视频',
  'photography': '摄影',
  'other': '其他'
};

// 动态生成过滤按钮
function initializeFilters() {
  const categories = new Set();
  workGrid.querySelectorAll('.work__card').forEach(card => {
    categories.add(card.dataset.category);
  });

  // 清空过滤容器
  filterContainer.innerHTML = '';

  // 添加"全部"按钮
  const allBtn = document.createElement('button');
  allBtn.className = 'filter__btn active';
  allBtn.dataset.filter = 'all';
  allBtn.textContent = '全部';
  filterContainer.appendChild(allBtn);

  // 按顺序添加其他分类按钮
  const orderedCategories = ['graphic', 'ui', 'painting', 'animation', 'photography', 'other'];
  orderedCategories.forEach(cat => {
    if (categories.has(cat)) {
      const btn = document.createElement('button');
      btn.className = 'filter__btn';
      btn.dataset.filter = cat;
      btn.textContent = categoryLabels[cat] || cat;
      filterContainer.appendChild(btn);
    }
  });

  // 重新绑定事件
  bindFilterEvents();
}

function bindFilterEvents() {
  filterContainer.querySelectorAll('.filter__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setWorkFilter(btn.dataset.filter);
    });
  });
}

function setWorkFilter(filter) {
  filterContainer.querySelectorAll('.filter__btn').forEach(b => b.classList.remove('active'));
  const btn = filterContainer.querySelector(`[data-filter="${filter}"]`);
  if (btn) btn.classList.add('active');
  workGrid.querySelectorAll('.work__card').forEach(card => {
    const match = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('hidden', !match);
    if (match) card.style.animation = 'fadeUp 0.4s ease forwards';
  });
}

// 页面加载时初始化
initializeFilters();

// ========================================
// SCROLL REVEAL
// ========================================
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });

document.querySelectorAll('.section, .work__card, .about__grid, .exp__item').forEach(el => {
  el.classList.add('reveal');
  revealObs.observe(el);
});

// ========================================
// SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = document.querySelector(a.getAttribute('href'));
  if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); }
}));

// ========================================
// EDIT MODE
// ========================================
(function () {
  // ── 修改这里可以更改密码 ──────────────────
  const EDIT_PASSWORD = 'guyue2026';
  // ──────────────────────────────────────────

  const editBtn      = document.getElementById('editBtn');
  const saveBtn      = document.getElementById('saveBtn');
  const cancelBtn    = document.getElementById('cancelBtn');
  const exportBtn    = document.getElementById('exportBtn');
  const pwdModal     = document.getElementById('pwdModal');
  const pwdInput     = document.getElementById('pwdInput');
  const pwdError     = document.getElementById('pwdError');
  const pwdCancelBtn = document.getElementById('pwdCancelBtn');
  const pwdConfirmBtn= document.getElementById('pwdConfirmBtn');
  const expList      = document.getElementById('expList');

  let snapshots  = {};
  let pickerReady= false;

  // ─── Load saved state on startup ──────────────
  loadAllContent();
  applyDeletedItems();
  renderCustomCards();
  renderCustomExps();
  applyAboutPhoto();

  // ─── Password modal ────────────────────────────
  editBtn.addEventListener('click', () => {
    pwdModal.classList.add('open');
    pwdInput.value = '';
    pwdError.style.opacity = '0';
    setTimeout(() => pwdInput.focus(), 80);
  });

  pwdCancelBtn.addEventListener('click', () => pwdModal.classList.remove('open'));
  pwdConfirmBtn.addEventListener('click', checkPwd);
  pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkPwd(); });

  function checkPwd() {
    if (pwdInput.value === EDIT_PASSWORD) {
      pwdModal.classList.remove('open');
      enterEditMode();
    } else {
      pwdError.style.opacity = '1';
      pwdInput.value = '';
      pwdInput.classList.add('shake');
      pwdInput.addEventListener('animationend', () => pwdInput.classList.remove('shake'), { once: true });
      pwdInput.focus();
    }
  }

  // ─── Enter edit mode ───────────────────────────
  function enterEditMode() {
    document.body.classList.add('edit-mode');
    snapshots = {};

    document.querySelectorAll('[data-key]').forEach(el => {
      snapshots[el.dataset.key] = el.innerHTML;
      el.contentEditable = 'true';
      el.spellcheck = false;
    });
    document.querySelectorAll('.card__img img').forEach(img => {
      snapshots['img_' + img.closest('[data-card-id]')?.dataset.cardId] = img.src;
    });
    snapshots['about_photo_bg'] = document.getElementById('aboutPhoto').style.backgroundImage;

    // Enable navigation editing
    initNavEditing();
    initImagePicker();
    initDeleteButtons();
    initAddButtons();
  }

  // ─── Save ──────────────────────────────────────
  saveBtn.addEventListener('click', () => {
    document.querySelectorAll('[data-key]').forEach(el => {
      localStorage.setItem('pf_' + el.dataset.key, el.innerHTML);
      el.contentEditable = 'false';
    });
    saveCustomNavItems();
    document.body.classList.remove('edit-mode');
    // Show success message
    const successMsg = Object.assign(document.createElement('div'), {
      textContent: '保存成功！',
      style: `
        position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white;
        padding: 10px 20px; border-radius: 4px; z-index: 10000; font-family: inherit;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `
    });
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 2000);
  });

  // ─── Cancel ────────────────────────────────────
  cancelBtn.addEventListener('click', () => {
    document.querySelectorAll('[data-key]').forEach(el => {
      el.innerHTML = snapshots[el.dataset.key] ?? el.innerHTML;
      el.contentEditable = 'false';
    });
    // Restore images
    document.querySelectorAll('.work__card[data-card-id] .card__img img').forEach(img => {
      const id = img.closest('[data-card-id]')?.dataset.cardId;
      if (snapshots['img_' + id]) img.src = snapshots['img_' + id];
    });
    // Restore about photo
    const ph = document.getElementById('aboutPhoto');
    if (ph && snapshots['about_photo_bg'] !== undefined) {
      ph.style.backgroundImage = snapshots['about_photo_bg'];
      ph.querySelector('span').style.display = snapshots['about_photo_bg'] ? 'none' : '';
    }
    document.body.classList.remove('edit-mode');
    // Re-apply deleted state in case user un-deleted
    applyDeletedItems();
  });

  // ─── Export HTML ───────────────────────────────
  exportBtn.addEventListener('click', () => {
    const clone = document.documentElement.cloneNode(true);

    // Bake editable content
    clone.querySelectorAll('[data-key]').forEach(el => {
      const saved = localStorage.getItem('pf_' + el.dataset.key);
      if (saved) el.innerHTML = saved;
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });
    // Bake card images
    clone.querySelectorAll('.work__card[data-card-id] .card__img img').forEach(img => {
      const id = img.closest('[data-card-id]')?.dataset.cardId;
      const saved = localStorage.getItem('pf_img_' + id);
      if (saved) img.src = saved;
    });
    // Bake about photo
    const savedAbout = localStorage.getItem('pf_about_photo');
    if (savedAbout) {
      const clonePh = clone.getElementById('aboutPhoto');
      if (clonePh) {
        clonePh.style.backgroundImage = `url(${savedAbout})`;
        clonePh.style.backgroundSize = 'cover';
        clonePh.style.backgroundPosition = 'center';
        const sp = clonePh.querySelector('span');
        if (sp) sp.style.display = 'none';
      }
    }
    // Remove hidden items
    const deletedCards = JSON.parse(localStorage.getItem('pf_deleted_cards') || '[]');
    const deletedExps  = JSON.parse(localStorage.getItem('pf_deleted_exps')  || '[]');
    deletedCards.forEach(id => clone.querySelector(`[data-card-id="${id}"]`)?.remove());
    deletedExps.forEach(id  => clone.querySelector(`[data-exp-id="${id}"]`)?.remove());

    // Remove edit UI
    clone.querySelector('.edit-toolbar')?.remove();
    clone.querySelector('.pwd-modal')?.remove();
    clone.body.classList.remove('edit-mode');

    const blob = new Blob(['<!DOCTYPE html>\n' + clone.outerHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'index.html' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  // ─── Delete buttons ────────────────────────────
  function initDeleteButtons() {
    document.querySelectorAll('.item-delete-btn').forEach(btn => {
      if (btn._delInited) return;
      btn._delInited = true;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const type = btn.dataset.deleteType;
        const id   = btn.dataset.deleteId;
        if (type === 'card') {
          btn.closest('.work__card').style.display = 'none';
          const arr = JSON.parse(localStorage.getItem('pf_deleted_cards') || '[]');
          if (!arr.includes(id)) arr.push(id);
          localStorage.setItem('pf_deleted_cards', JSON.stringify(arr));
          // 重新生成过滤按钮
          initializeFilters();
        } else if (type === 'exp') {
          btn.closest('.exp__item').style.display = 'none';
          const arr = JSON.parse(localStorage.getItem('pf_deleted_exps') || '[]');
          if (!arr.includes(id)) arr.push(id);
          localStorage.setItem('pf_deleted_exps', JSON.stringify(arr));
        }
      });
    });
  }

  function applyDeletedItems() {
    const deletedCards = JSON.parse(localStorage.getItem('pf_deleted_cards') || '[]');
    const deletedExps  = JSON.parse(localStorage.getItem('pf_deleted_exps')  || '[]');
    deletedCards.forEach(id => {
      const el = document.querySelector(`[data-card-id="${id}"]`);
      if (el) el.style.display = 'none';
    });
    deletedExps.forEach(id => {
      const el = document.querySelector(`[data-exp-id="${id}"]`);
      if (el) el.style.display = 'none';
    });
  }

  // ─── Navigation editing ────────────────────────
  function initNavEditing() {
    const navAddBtn = document.getElementById('navAddBtn');
    const mobileNavAddBtn = document.getElementById('mobileNavAddBtn');

    if (navAddBtn && !navAddBtn._addInited) {
      navAddBtn._addInited = true;
      navAddBtn.querySelector('button').addEventListener('click', addNewNavItem);
    }

    if (mobileNavAddBtn && !mobileNavAddBtn._addInited) {
      mobileNavAddBtn._addInited = true;
      mobileNavAddBtn.querySelector('button').addEventListener('click', addNewNavItem);
    }

    // Load saved nav items
    loadCustomNavItems();
  }

  function loadCustomNavItems() {
    const customNavItems = JSON.parse(localStorage.getItem('pf_custom_nav_items') || '[]');
    const navLinks = document.getElementById('navLinks');
    const mobileMenuLinks = document.getElementById('mobileMenuLinks');

    customNavItems.forEach(item => {
      // Check if not already exists
      if (!navLinks.querySelector(`[data-nav-id="${item.id}"]`)) {
        const li = createNavItemElement(item);
        navLinks.insertBefore(li, document.getElementById('navAddBtn'));
      }
      if (!mobileMenuLinks.querySelector(`[data-nav-id="${item.id}"]`)) {
        const li = createNavItemElement(item);
        li.querySelector('a').classList.add('menu-link');
        mobileMenuLinks.insertBefore(li, document.getElementById('mobileNavAddBtn'));
      }
    });
  }

  function createNavItemElement({ id, label, href }) {
    const li = document.createElement('li');
    li.dataset.navId = id;
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.dataset.key = `nav-${id}`;
    li.appendChild(a);
    return li;
  }

  function addNewNavItem() {
    const label = prompt('导航项标签', '新项目');
    if (!label) return;
    const href = prompt('导航项链接（如：#section-id）', '#section');
    if (!href) return;

    const id = 'n' + Date.now();
    const item = { id, label, href };
    const li = createNavItemElement(item);

    const navLinks = document.getElementById('navLinks');
    const mobileMenuLinks = document.getElementById('mobileMenuLinks');

    navLinks.insertBefore(li, document.getElementById('navAddBtn'));

    const mobileLink = createNavItemElement(item);
    mobileLink.querySelector('a').classList.add('menu-link');
    mobileMenuLinks.insertBefore(mobileLink, document.getElementById('mobileNavAddBtn'));

    // Make editable in edit mode
    li.querySelector('a').contentEditable = 'true';
    mobileLink.querySelector('a').contentEditable = 'true';
    li.querySelector('a').spellcheck = false;
    mobileLink.querySelector('a').spellcheck = false;

    saveCustomNavItems();
  }

  function saveCustomNavItems() {
    const customItems = [];
    document.querySelectorAll('[data-nav-id]').forEach(li => {
      const a = li.querySelector('a');
      customItems.push({
        id: li.dataset.navId,
        label: a.textContent,
        href: a.href.split('#').pop() ? '#' + a.href.split('#').pop() : a.href
      });
    });
    localStorage.setItem('pf_custom_nav_items', JSON.stringify(customItems));
  }

  // ─── Add buttons ───────────────────────────────
  function initAddButtons() {
    const addCardBtn = document.getElementById('addCardBtn');
    const addExpBtn  = document.getElementById('addExpBtn');
    if (!addCardBtn._addInited) {
      addCardBtn._addInited = true;
      addCardBtn.addEventListener('click', addNewCard);
    }
    if (!addExpBtn._addInited) {
      addExpBtn._addInited = true;
      addExpBtn.addEventListener('click', addNewExp);
    }
  }

  function addNewCard() {
    console.log('addNewCard clicked');
    const id = 'c' + Date.now();
    const defaultCategory = 'graphic';

    openNewCardEditor(defaultCategory, ({ title, tag, desc, imgSrc, category }) => {
      console.log('openNewCardEditor callback', { title, tag, desc, imgSrc, category });
      const card = createCardElement({ id, tag, title, desc, category, imgSrc });
      workGrid.insertBefore(card, document.getElementById('addCardBtn'));

      card.querySelectorAll('[data-key]').forEach(el => {
        el.contentEditable = 'true';
        el.spellcheck = false;
        snapshots[el.dataset.key] = el.innerHTML;
        el.style.outline = '1.5px dashed rgba(192, 168, 130, 0.7)';
        el.style.outlineOffset = '4px';
        el.style.borderRadius = '3px';
        el.style.cursor = 'text';
      });

      initDeleteButtons();
      initImagePicker();
      revealObs.observe(card);
      saveCustomCards();
      // 重新生成过滤按钮
      initializeFilters();

      // 新增作品后直接显示（避免当前过滤器隐藏）
      setWorkFilter('all');

      setTimeout(() => {
        const hint = Object.assign(document.createElement('div'), {
          textContent: '✨ 新作品已添加！请点击图片上传，或直接修改标题/描述',
          style: `
            position: fixed; top: 80px; right: 20px; background: #4CAF50; color: white;
            padding: 12px 20px; border-radius: 6px; font-size: 0.85rem; font-family: inherit;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; max-width: 320px;
          `
        });
        document.body.appendChild(hint);
        setTimeout(() => hint.remove(), 4000);
        card.querySelector('.card__title').focus();
      }, 100);
    });
  }

  function openNewCardEditor(category, onCreate) {
    console.log('openNewCardEditor:', category);
    const categories = [
      { value: 'graphic', label: '平面设计' },
      { value: 'ui', label: 'UI / 产品' },
      { value: 'painting', label: '绘画' },
      { value: 'animation', label: '动画 / 视频' },
      { value: 'photography', label: '摄影' },
      { value: 'other', label: '其他' }
    ];
    let selectedCategory = category || 'graphic';

    const modal = document.createElement('div');
    modal.className = 'new-card-editor-overlay';
    modal.innerHTML = `
      <div class="new-card-editor-box">
        <h3>添加新作品</h3>
        <label>作品分类
          <select id="newCardCategory">
            ${categories.map(c => `<option value="${c.value}" ${c.value === selectedCategory ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </label>
        <label>作品名称 <input type="text" id="newCardTitle" value="作品标题" /></label>
        <label>作品标签 <input type="text" id="newCardTag" value="新标签" /></label>
        <label>作品描述 <textarea id="newCardDesc">作品描述...</textarea></label>
        <label>上传图片 <input type="file" id="newCardImg" accept="image/*" /></label>
        <div class="new-card-editor-preview" id="newCardPreview">预览图片</div>
        <div class="new-card-editor-actions">
          <button type="button" id="newCardCancel">取消</button>
          <button type="button" id="newCardCreate">添加作品</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const imgInput = modal.querySelector('#newCardImg');
    let imgSrc = '';
    imgInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        imgSrc = ev.target.result;
        const prev = modal.querySelector('#newCardPreview');
        prev.style.backgroundImage = `url(${imgSrc})`;
        prev.textContent = '';
      };
      reader.readAsDataURL(file);
    });

    modal.querySelector('#newCardCancel').addEventListener('click', () => modal.remove());

    modal.querySelector('#newCardCreate').addEventListener('click', () => {
      selectedCategory = modal.querySelector('#newCardCategory').value;
      const title = modal.querySelector('#newCardTitle').value.trim() || '作品标题';
      const tag = modal.querySelector('#newCardTag').value.trim() || '新标签';
      const desc = modal.querySelector('#newCardDesc').value.trim() || '作品描述...';
      onCreate({ title, tag, desc, imgSrc, category: selectedCategory });
      modal.remove();
    });
  }

  function addNewExp() {
    const id = 'e' + Date.now();
    const item = createExpElement({ id, period: '2026.01 — 至今', tag: '类型', company: '公司名称', role: '职位', desc: '描述...' });
    expList.appendChild(item);
    item.querySelectorAll('[data-key]').forEach(el => {
      el.contentEditable = 'true';
      el.spellcheck = false;
    });
    item.querySelector('.exp__company').focus();
    saveCustomExps();
    initDeleteButtons();
    // Reveal animation
    revealObs.observe(item);
  }

  // ─── Create elements ───────────────────────────
  function createCardElement({ id, tag, title, desc, category, imgSrc }) {
    const art = document.createElement('article');
    art.className = 'work__card';
    art.dataset.category = category;
    art.dataset.cardId = id;
    art.innerHTML = `
      <div class="card__img">
        <img src="${imgSrc || ''}" alt="${title}" class="${imgSrc ? '' : 'card__img--empty'}" />
        <div class="card__img-edit-hint">点击更换图片</div>
        <div class="card__overlay"><a href="#" class="card__link">查看作品 →</a></div>
        <button class="item-delete-btn" data-delete-type="card" data-delete-id="${id}" title="删除">×</button>
      </div>
      <div class="card__info">
        <span class="card__tag" data-key="card-${id}-tag">${tag}</span>
        <h3 class="card__title" data-key="card-${id}-title">${title}</h3>
        <p class="card__desc" data-key="card-${id}-desc">${desc}</p>
      </div>`;
    return art;
  }

  function createExpElement({ id, period, tag, company, role, desc }) {
    const div = document.createElement('div');
    div.className = 'exp__item';
    div.dataset.expId = id;
    div.innerHTML = `
      <button class="item-delete-btn" data-delete-type="exp" data-delete-id="${id}" title="删除">×</button>
      <div class="exp__meta">
        <div class="exp__period" data-key="exp-${id}-period">${period}</div>
        <div class="exp__tag" data-key="exp-${id}-tag">${tag}</div>
      </div>
      <div class="exp__content">
        <h3 class="exp__company" data-key="exp-${id}-company">${company}</h3>
        <p class="exp__role" data-key="exp-${id}-role">${role}</p>
        <p class="exp__desc" data-key="exp-${id}-desc">${desc}</p>
      </div>`;
    return div;
  }

  // ─── Persist & restore custom items ───────────
  function saveCustomCards() {
    const customs = [];
    workGrid.querySelectorAll('.work__card[data-card-id^="c"]').forEach(card => {
      const id = card.dataset.cardId;
      customs.push({
        id,
        tag:      card.querySelector(`[data-key="card-${id}-tag"]`)?.innerHTML || '',
        title:    card.querySelector(`[data-key="card-${id}-title"]`)?.innerHTML || '',
        desc:     card.querySelector(`[data-key="card-${id}-desc"]`)?.innerHTML || '',
        category: card.dataset.category,
        imgSrc:   card.querySelector('img')?.src || '',
      });
    });
    localStorage.setItem('pf_custom_cards', JSON.stringify(customs));
  }

  function renderCustomCards() {
    const customs = JSON.parse(localStorage.getItem('pf_custom_cards') || '[]');
    customs.forEach(c => {
      const card = createCardElement(c);
      workGrid.insertBefore(card, document.getElementById('addCardBtn'));
    });
  }

  function saveCustomExps() {
    const customs = [];
    expList.querySelectorAll('.exp__item[data-exp-id^="e"]').forEach(item => {
      const id = item.dataset.expId;
      customs.push({
        id,
        period:  item.querySelector(`[data-key="exp-${id}-period"]`)?.innerHTML || '',
        tag:     item.querySelector(`[data-key="exp-${id}-tag"]`)?.innerHTML || '',
        company: item.querySelector(`[data-key="exp-${id}-company"]`)?.innerHTML || '',
        role:    item.querySelector(`[data-key="exp-${id}-role"]`)?.innerHTML || '',
        desc:    item.querySelector(`[data-key="exp-${id}-desc"]`)?.innerHTML || '',
      });
    });
    localStorage.setItem('pf_custom_exps', JSON.stringify(customs));
  }

  function renderCustomExps() {
    const customs = JSON.parse(localStorage.getItem('pf_custom_exps') || '[]');
    customs.forEach(c => {
      const item = createExpElement(c);
      expList.appendChild(item);
      revealObs.observe(item);
    });
  }

  // ─── Load saved text content ───────────────────
  function loadAllContent() {
    document.querySelectorAll('[data-key]').forEach(el => {
      const saved = localStorage.getItem('pf_' + el.dataset.key);
      if (saved) el.innerHTML = saved;
    });
    // Restore original card images
    document.querySelectorAll('.work__card[data-card-id] .card__img img').forEach(img => {
      const id = img.closest('[data-card-id]')?.dataset.cardId;
      const saved = localStorage.getItem('pf_img_' + id);
      if (saved) img.src = saved;
    });
  }

  // ─── About photo ───────────────────────────────
  function applyAboutPhoto() {
    const saved = localStorage.getItem('pf_about_photo');
    if (!saved) return;
    const ph = document.getElementById('aboutPhoto');
    if (!ph) return;
    const img = ph.querySelector('img');
    if (img) {
      img.src = saved;
    } else {
      ph.style.backgroundImage = `url(${saved})`;
      ph.style.backgroundSize = 'cover';
      ph.style.backgroundPosition = 'center';
      const span = ph.querySelector('span');
      if (span) span.style.display = 'none';
    }
  }

  // ─── Image picker ──────────────────────────────
  function initImagePicker() {
    if (pickerReady) return;
    pickerReady = true;

    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });
    input.style.display = 'none';
    document.body.appendChild(input);

    let targetImg = null, targetKey = null, targetPh = null;

    // Delegate to handle dynamically added cards too
    workGrid.addEventListener('click', e => {
      if (!document.body.classList.contains('edit-mode')) return;
      const cardImg = e.target.closest('.card__img');
      if (!cardImg || e.target.classList.contains('item-delete-btn')) return;
      const card = cardImg.closest('[data-card-id]');
      targetImg = cardImg.querySelector('img');
      targetKey = 'pf_img_' + card?.dataset.cardId;
      targetPh  = null;
      input.click();
    });

    document.getElementById('aboutPhoto').addEventListener('click', () => {
      if (!document.body.classList.contains('edit-mode')) return;
      const aboutPhoto = document.getElementById('aboutPhoto');
      const isImg = aboutPhoto.querySelector('img');
      targetImg = isImg ? aboutPhoto.querySelector('img') : null;
      targetKey = 'pf_about_photo';
      targetPh  = isImg ? null : aboutPhoto;
      input.click();
    });

    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const data = ev.target.result;
        if (targetImg) {
          targetImg.src = data;
          targetImg.classList.remove('card__img--empty');
        } else if (targetPh) {
          targetPh.style.backgroundImage = `url(${data})`;
          targetPh.style.backgroundSize = 'cover';
          targetPh.style.backgroundPosition = 'center';
          const span = targetPh.querySelector('span');
          if (span) span.style.display = 'none';
        }
        if (targetKey) localStorage.setItem(targetKey, data);
        // Auto-save custom cards after image change
        saveCustomCards();
      };
      reader.readAsDataURL(file);
      input.value = '';
    });
  }

  // Auto-save all content on text change (debounced)
  let saveTimer;
  document.addEventListener('input', () => {
    if (!document.body.classList.contains('edit-mode')) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      // Save all editable content
      document.querySelectorAll('[data-key]').forEach(el => {
        localStorage.setItem('pf_' + el.dataset.key, el.innerHTML);
      });
      // Save custom cards and experiences
      saveCustomCards();
      saveCustomExps();
    }, 800);
  });
})();

// ========================================
// COPY TO CLIPBOARD
// ========================================
document.querySelectorAll('.contact-method[data-copy]').forEach(method => {
  method.addEventListener('click', async (e) => {
    const textToCopy = method.dataset.copy;
    const valueEl = method.querySelector('.contact-method__value');

    // 对于WeChat，阻止默认行为
    if (method.href === '#') {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      await navigator.clipboard.writeText(textToCopy);

      // 显示已复制反馈
      const originalText = valueEl.textContent;
      valueEl.textContent = '✓ 已复制';
      valueEl.style.color = '#2a7a4f';

      setTimeout(() => {
        valueEl.textContent = originalText;
        valueEl.style.color = '';
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  });
});

// ========================================
// QRCODE SHARE
// ========================================
function initQRCodeShare() {
  const shareQrcodeBtn = document.getElementById('shareQrcodeBtn');
  const qrcodeModal = document.getElementById('qrcodeModal');
  const qrcodeCloseBtn = document.getElementById('qrcodeCloseBtn');
  const qrcodeContainer = document.getElementById('qrcodeContainer');

  // Check if elements exist
  if (!shareQrcodeBtn || !qrcodeModal || !qrcodeContainer) {
    console.warn('QR Code elements not found');
    return;
  }

  let qrcodeGenerated = false;

  shareQrcodeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    qrcodeModal.classList.add('open');

    // Generate QR code only once
    if (!qrcodeGenerated) {
      // Clear previous QR code
      qrcodeContainer.innerHTML = '';

      // Get current page URL
      const url = window.location.href;

      // Use QR Server API to generate QR code
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;

      const img = document.createElement('img');
      img.src = qrApiUrl;
      img.alt = '作品集分享二维码';
      img.style.maxWidth = '100%';
      qrcodeContainer.appendChild(img);

      qrcodeGenerated = true;
    }
  });

  if (qrcodeCloseBtn) {
    qrcodeCloseBtn.addEventListener('click', () => {
      qrcodeModal.classList.remove('open');
    });
  }

  // Close modal when clicking outside
  qrcodeModal.addEventListener('click', (e) => {
    if (e.target === qrcodeModal) {
      qrcodeModal.classList.remove('open');
    }
  });
}

// Initialize QR Code Share when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQRCodeShare);
} else {
  initQRCodeShare();
}
