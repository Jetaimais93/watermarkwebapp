// ==================== 水印边框大师 - 高清版 ====================

let images = [];
let currentPreviewIndex = null;
let currentBrand = null;
let currentTextWatermark = null;
let currentImageWatermark = null;

// ==================== 品牌配置 ====================
const brandTemplates = [
    { id: 'SONY', name: 'Sony', logo: 'logos/SONY.png' },
    { id: 'leica', name: 'Leica', logo: 'logos/leica.png' },
    { id: 'HUAWEI', name: 'Huawei', logo: 'logos/HUAWEI.png' },
    { id: 'Canon', name: 'Canon', logo: 'logos/CANON.png' },
    { id: 'nikon', name: 'Nikon', logo: 'logos/nikon.png' },
    { id: 'FUJIFILM', name: 'Fujifilm', logo: 'logos/FUJIFILM.png' },
    { id: 'DJI', name: 'DJI', logo: 'logos/DJI.png' },
    { id: 'Apple', name: 'Apple', logo: 'logos/Apple.png' },
    { id: 'GoPro', name: 'GoPro', logo: 'logos/GoPro.png' },
    { id: 'HONOR', name: 'Honor', logo: 'logos/HONOR.png' },
    { id: 'HTC', name: 'HTC', logo: 'logos/HTC.png' },
    { id: 'LUMIX', name: 'Lumix', logo: 'logos/LUMIX.png' },
    { id: 'nokia', name: 'Nokia', logo: 'logos/nokia.png' },
    { id: 'oneplus', name: 'OnePlus', logo: 'logos/oneplus.png' },
    { id: 'OPPO', name: 'OPPO', logo: 'logos/OPPO.png' },
    { id: 'Pentax', name: 'Pentax', logo: 'logos/Pentax.png' },
    { id: 'Phase One', name: 'Phase One', logo: 'logos/Phase One.png' },
    { id: 'realme', name: 'realme', logo: 'logos/realme.png' },
    { id: 'redmi', name: 'Redmi', logo: 'logos/redmi.png' },
    { id: 'Ricoh', name: 'Ricoh', logo: 'logos/Ricoh.png' },
    { id: 'SAMSUNG', name: 'Samsung', logo: 'logos/SAMSUNG.png' },
    { id: 'sonyalpha', name: 'Sony Alpha', logo: 'logos/sonyalpha.png' },
    { id: 'sony-ericsson', name: 'Sony Ericsson', logo: 'logos/sony-ericsson.png' },
    { id: 'VIVO', name: 'vivo', logo: 'logos/VIVO.png' },
    { id: 'XIAOMI', name: 'Xiaomi', logo: 'logos/XIAOMI.png' },
    { id: 'ZEISS', name: 'Zeiss', logo: 'logos/ZEISS.png' }
];

// ==================== 初始化 ====================
function init() {
    initBrandButtons();
    initUpload();
    initControls();
    initLivePreview();
    initModal();
    loadSavedTemplates();
}

// ==================== 品牌按钮 ====================
function initBrandButtons() {
    const container = document.getElementById('brandTemplates');
    container.innerHTML = '';

    brandTemplates.forEach(brand => {
        const btn = document.createElement('button');
        btn.className = 'brand-btn';
        btn.innerHTML = `
            <img src="${brand.logo}" alt="${brand.name}" onerror="this.style.display='none'">
            <span>${brand.name}</span>
        `;
        btn.onclick = () => {
            currentBrand = brand;
            currentTextWatermark = null;
            currentImageWatermark = null;
            document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateLivePreview();
        };
        container.appendChild(btn);
    });
}

// ==================== 上传 ====================
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

    const trigger = (e) => { e.preventDefault(); fileInput.click(); };
    uploadBtn.addEventListener('click', trigger);
    uploadBtn.addEventListener('touchend', trigger);
    uploadArea.addEventListener('click', trigger);

    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', e => {
        e.preventDefault(); uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    fileInput.onchange = () => handleFiles(fileInput.files);
}

async function handleFiles(fileList) {
    const uploadArea = document.getElementById('uploadArea');
    const grid = document.getElementById('imagesGrid');
    uploadArea.style.display = 'none';
    grid.style.display = 'block';

    const files = Array.from(fileList).slice(0, 50);

    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        let exif = {};
        try { exif = await exifr.parse(file, { gps: false }); } catch (e) {}

        const imgData = { id, file, originalUrl: url, processedUrl: null, exif, settings: null };
        images.push(imgData);
        renderImageCard(imgData);
    }
    document.getElementById('imageCount').textContent = `${images.length} 张照片`;
}

function renderImageCard(imgData) {
    const container = document.getElementById('gridContainer');
    const card = document.createElement('div');
    card.className = 'image-card';
    card.dataset.id = imgData.id;
    const src = imgData.processedUrl || imgData.originalUrl;
    card.innerHTML = `
        <img src="${src}" alt="">
        <div class="info">
            <div>${imgData.file.name}</div>
            <div class="meta">${imgData.exif?.Make || ''}</div>
        </div>
        <div class="actions">
            <button onclick="selectImageForPreview('${imgData.id}')">👁️</button>
            <button onclick="downloadSingle('${imgData.id}')">⬇️</button>
            <button onclick="deleteImage('${imgData.id}', this)">🗑️</button>
        </div>
    `;
    container.appendChild(card);
}

function refreshGrid() {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    images.forEach(img => renderImageCard(img));
}

// ==================== 控制面板 ====================
function initControls() {
    document.getElementById('addTextWatermarkBtn').onclick = () => {
        const text = document.getElementById('customText').value.trim();
        if (!text) return alert('请输入文字');
        currentTextWatermark = {
            text,
            fontSize: parseInt(document.getElementById('fontSize').value),
            color: document.getElementById('textColor').value,
            opacity: parseFloat(document.getElementById('textOpacity').value) / 100,
            fontFamily: document.getElementById('fontFamily').value
        };
        currentBrand = null;
        currentImageWatermark = null;
        updateLivePreview();
    };

    setupImageWatermark();

    document.getElementById('applyBorderBtn').onclick = applyBorderToAll;

    ['fontSize', 'textOpacity', 'borderWidth', 'borderRadius', 'liveOpacity'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = () => {
            updateSliderValues();
            updateLivePreview();
        };
    });

    document.getElementById('aspectRatio').onchange = updateLivePreview;
    document.getElementById('saveTemplateBtn').onclick = saveCurrentTemplate;
    updateSliderValues();
}

function updateSliderValues() {
    const map = [
        ['fontSize', 'fontSizeValue'],
        ['textOpacity', 'textOpacityValue'],
        ['borderWidth', 'borderWidthValue'],
        ['borderRadius', 'borderRadiusValue'],
        ['liveOpacity', 'liveOpacityValue']
    ];
    map.forEach(([input, span]) => {
        const i = document.getElementById(input);
        const s = document.getElementById(span);
        if (i && s) s.textContent = i.value;
    });
}

function setupImageWatermark() {
    const btn = document.getElementById('uploadImageWatermarkBtn');
    const input = document.getElementById('imageWatermarkInput');
    const preview = document.getElementById('imageWatermarkPreview');
    const thumb = document.getElementById('imageWatermarkThumb');
    const remove = document.getElementById('removeImageWatermarkBtn');

    btn.onclick = () => input.click();
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                currentImageWatermark = { url: ev.target.result, image: img };
                thumb.src = ev.target.result;
                preview.style.display = 'block';
                btn.style.display = 'none';
                currentBrand = null;
                currentTextWatermark = null;
                updateLivePreview();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };
    remove.onclick = () => {
        currentImageWatermark = null;
        preview.style.display = 'none';
        btn.style.display = 'block';
        input.value = '';
        updateLivePreview();
    };
}

function applyBorderToAll() {
    const style = document.getElementById('borderStyle').value;
    const width = parseInt(document.getElementById('borderWidth').value);
    const radius = parseInt(document.getElementById('borderRadius').value);
    const color = document.getElementById('borderColor').value;

    images.forEach(img => {
        if (!img.settings) img.settings = {};
        img.settings.border = { style, width, radius, color };
    });
    alert('边框已应用');
    refreshGrid();
    updateLivePreview();
}

// ==================== 右侧实时预览 ====================
function initLivePreview() {
    const canvas = document.getElementById('livePreviewCanvas');
    const opacitySlider = document.getElementById('liveOpacity');
    const aspect = document.getElementById('aspectRatio');

    opacitySlider.oninput = updateLivePreview;
    aspect.onchange = updateLivePreview;

    // 下载当前预览（高清PNG）
    document.getElementById('downloadCurrentBtn').onclick = downloadCurrentAsPNG;
    document.getElementById('openFineTuneBtn').onclick = () => {
        if (currentPreviewIndex !== null) {
            openFineTuneModal(images[currentPreviewIndex]);
        } else if (images.length > 0) {
            currentPreviewIndex = 0;
            openFineTuneModal(images[0]);
        } else {
            alert('请先上传照片');
        }
    };
}

function updateLivePreview() {
    if (images.length === 0) return;
    const canvas = document.getElementById('livePreviewCanvas');
    const ctx = canvas.getContext('2d');

    // 默认使用第一张或当前选中的
    let target = images[0];
    if (currentPreviewIndex !== null) target = images[currentPreviewIndex];

    const img = new Image();
    img.src = target.originalUrl;
    img.onload = () => {
        let cw = 800, ch = 600;
        const ratio = document.getElementById('aspectRatio').value;
        if (ratio === '16:9') { cw = 800; ch = 450; }
        else if (ratio === '4:3') { cw = 800; ch = 600; }
        else if (ratio === '3:2') { cw = 800; ch = 533; }
        else if (ratio === '1:1') { cw = 600; ch = 600; }
        else if (ratio === '9:16') { cw = 450; ch = 800; }

        canvas.width = cw;
        canvas.height = ch;
        ctx.drawImage(img, 0, 0, cw, ch);

        const opacity = parseFloat(document.getElementById('liveOpacity').value) / 100;
        ctx.globalAlpha = opacity;

        // 绘制水印
        if (currentBrand) drawBrandLogo(ctx, cw, ch, currentBrand);
        else if (currentTextWatermark) drawTextWatermark(ctx, cw, ch, currentTextWatermark);
        else if (currentImageWatermark) drawImageWatermark(ctx, cw, ch, currentImageWatermark);

        // 边框
        const borderStyle = document.getElementById('borderStyle').value;
        if (borderStyle !== 'none') {
            const border = {
                style: borderStyle,
                width: parseInt(document.getElementById('borderWidth').value),
                radius: parseInt(document.getElementById('borderRadius').value),
                color: document.getElementById('borderColor').value
            };
            drawBorder(ctx, cw, ch, border);
        }
    };
}

function drawBrandLogo(ctx, w, h, brand) {
    const img = new Image();
    img.src = brand.logo;
    const scale = 0.55;
    const lw = 240 * scale, lh = 75 * scale;
    ctx.drawImage(img, w * 0.5 - lw / 2, h * 0.9 - lh / 2, lw, lh);
}

function drawTextWatermark(ctx, w, h, wm) {
    ctx.font = `bold ${wm.fontSize}px ${wm.fontFamily}`;
    ctx.fillStyle = wm.color;
    ctx.textAlign = 'center';
    ctx.fillText(wm.text, w * 0.5, h * 0.92);
}

function drawImageWatermark(ctx, w, h, wm) {
    const img = wm.image;
    const scale = 0.5;
    const iw = img.width * scale, ih = img.height * scale;
    ctx.drawImage(img, w * 0.5 - iw / 2, h * 0.88 - ih / 2, iw, ih);
}

function drawBorder(ctx, w, h, border) {
    ctx.strokeStyle = border.color;
    ctx.lineWidth = border.width;
    if (border.style === 'rect' || border.style === 'rounded') {
        const r = border.style === 'rounded' ? border.radius : 0;
        ctx.beginPath();
        ctx.roundRect(border.width / 2, border.width / 2, w - border.width, h - border.width, r);
        ctx.stroke();
    } else if (border.style === 'square') {
        const size = Math.min(w, h) - border.width;
        ctx.strokeRect((w - size) / 2, (h - size) / 2, size, size);
    } else if (border.style === 'circle') {
        const r = Math.min(w, h) / 2 - border.width / 2;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ==================== 下载高清 PNG ====================
function downloadCurrentAsPNG() {
    if (images.length === 0) return alert('请先上传照片');

    const canvas = document.getElementById('livePreviewCanvas');
    const link = document.createElement('a');
    link.download = `watermark_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadSingle(id) {
    const imgData = images.find(i => i.id === id);
    if (!imgData) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imgData.originalUrl;

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 绘制水印（简化版）
        if (imgData.settings) {
            ctx.globalAlpha = imgData.settings.opacity || 0.85;
            if (imgData.settings.brand) drawBrandLogo(ctx, img.width, img.height, imgData.settings.brand);
            if (imgData.settings.text) drawTextWatermark(ctx, img.width, img.height, imgData.settings.text);
            if (imgData.settings.imageWm) drawImageWatermark(ctx, img.width, img.height, imgData.settings.imageWm);
            if (imgData.settings.border) drawBorder(ctx, img.width, img.height, imgData.settings.border);
        }
        const link = document.createElement('a');
        link.download = `watermark_${imgData.file.name.split('.')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
}

// ==================== 选择图片更新预览 ====================
function selectImageForPreview(id) {
    const idx = images.findIndex(i => i.id === id);
    if (idx === -1) return;
    currentPreviewIndex = idx;
    updateLivePreview();
}

// ==================== 精细调整模态框 ====================
function initModal() {
    const modal = document.getElementById('previewModal');
    document.getElementById('closeModal').onclick = () => modal.classList.remove('show');
    document.getElementById('applyToCurrentBtn').onclick = () => applyToCurrent(true);
    document.getElementById('applyToAllBtn').onclick = () => applyToCurrent(false);

    ['globalOpacity', 'rotation'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = () => {
            if (currentPreviewIndex !== null) renderFinePreview(images[currentPreviewIndex]);
        };
    });
}

function openFineTuneModal(imgData) {
    currentPreviewIndex = images.findIndex(i => i.id === imgData.id);
    const modal = document.getElementById('previewModal');
    modal.classList.add('show');
    renderFinePreview(imgData);
}

function renderFinePreview(imgData) {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imgData.originalUrl;
    img.onload = () => {
        canvas.width = 1100;
        canvas.height = 750;
        ctx.drawImage(img, 0, 0, 1100, 750);

        const opacity = parseFloat(document.getElementById('globalOpacity').value) / 100;
        ctx.globalAlpha = opacity;

        if (currentBrand) drawBrandLogo(ctx, 1100, 750, currentBrand);
        else if (currentTextWatermark) drawTextWatermark(ctx, 1100, 750, currentTextWatermark);
        else if (currentImageWatermark) drawImageWatermark(ctx, 1100, 750, currentImageWatermark);

        const borderStyle = document.getElementById('borderStyle').value;
        if (borderStyle !== 'none') {
            const border = {
                style: borderStyle,
                width: parseInt(document.getElementById('borderWidth').value),
                radius: parseInt(document.getElementById('borderRadius').value),
                color: document.getElementById('borderColor').value
            };
            drawBorder(ctx, 1100, 750, border);
        }
    };
}

function applyToCurrent(applyAll = false) {
    const settings = {
        opacity: parseFloat(document.getElementById('globalOpacity').value) / 100,
        rotation: parseFloat(document.getElementById('rotation').value),
        border: {
            style: document.getElementById('borderStyle').value,
            width: parseInt(document.getElementById('borderWidth').value),
            radius: parseInt(document.getElementById('borderRadius').value),
            color: document.getElementById('borderColor').value
        }
    };

    const targets = applyAll ? images : [images[currentPreviewIndex]];
    targets.forEach(img => {
        img.settings = { ...settings };
        if (currentBrand) img.settings.brand = currentBrand;
        if (currentTextWatermark) img.settings.text = currentTextWatermark;
        if (currentImageWatermark) img.settings.imageWm = currentImageWatermark;
        generateProcessedImage(img);
    });

    document.getElementById('previewModal').classList.remove('show');
    setTimeout(() => {
        refreshGrid();
        updateLivePreview();
        document.getElementById('downloadAllBtn').disabled = false;
    }, 500);
}

function generateProcessedImage(imgData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imgData.originalUrl;
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (imgData.settings) {
            ctx.globalAlpha = imgData.settings.opacity || 0.85;
            if (imgData.settings.brand) drawBrandLogo(ctx, img.width, img.height, imgData.settings.brand);
            if (imgData.settings.text) drawTextWatermark(ctx, img.width, img.height, imgData.settings.text);
            if (imgData.settings.imageWm) drawImageWatermark(ctx, img.width, img.height, imgData.settings.imageWm);
            if (imgData.settings.border) drawBorder(ctx, img.width, img.height, imgData.settings.border);
        }
        imgData.processedUrl = canvas.toDataURL('image/png');
    };
}

// ==================== 模板 ====================
function saveCurrentTemplate() {
    const name = prompt('模板名称', '我的水印模板');
    if (!name) return;
    const template = {
        name,
        brand: currentBrand,
        text: currentTextWatermark,
        border: {
            style: document.getElementById('borderStyle').value,
            width: document.getElementById('borderWidth').value,
            radius: document.getElementById('borderRadius').value,
            color: document.getElementById('borderColor').value
        }
    };
    let saved = JSON.parse(localStorage.getItem('wmTemplates') || '[]');
    saved.push(template);
    localStorage.setItem('wmTemplates', JSON.stringify(saved));
    loadSavedTemplates();
}

function loadSavedTemplates() {
    const container = document.getElementById('myTemplates');
    container.innerHTML = '';
    const saved = JSON.parse(localStorage.getItem('wmTemplates') || '[]');
    saved.forEach((tpl, index) => {
        const div = document.createElement('div');
        div.className = 'template-item';
        div.innerHTML = `<span>${tpl.name}</span><button onclick="event.stopImmediatePropagation();deleteTemplate(${index},this)">×</button>`;
        div.onclick = () => loadTemplate(tpl);
        container.appendChild(div);
    });
}

function deleteTemplate(index, el) {
    let saved = JSON.parse(localStorage.getItem('wmTemplates') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('wmTemplates', JSON.stringify(saved));
    el.parentElement.remove();
}

function loadTemplate(tpl) {
    if (tpl.brand) currentBrand = tpl.brand;
    if (tpl.text) currentTextWatermark = tpl.text;
    if (tpl.border) {
        document.getElementById('borderStyle').value = tpl.border.style;
        document.getElementById('borderWidth').value = tpl.border.width;
        document.getElementById('borderRadius').value = tpl.border.radius;
        document.getElementById('borderColor').value = tpl.border.color;
    }
    alert(`模板「${tpl.name}」已加载`);
    updateLivePreview();
}

// ==================== 启动 ====================
window.onload = init;