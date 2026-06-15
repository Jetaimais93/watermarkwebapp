// ==================== 水印边框大师 Web版 - 高自由度版 ====================

let images = [];
let currentPreviewIndex = null;
let currentBrand = null;
let currentTextWatermark = null;
let currentImageWatermark = null;
let previewSettings = {
    posX: 50, posY: 50, scale: 1, rotation: 0, opacity: 0.85,
    borderStyle: 'none', borderWidth: 8, borderRadius: 0, borderColor: '#000000'
};

// ==================== 品牌配置（带 logo） ====================
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
        btn.onclick = () => selectBrand(brand, btn);
        container.appendChild(btn);
    });
}

function selectBrand(brand, btn) {
    currentBrand = brand;
    currentTextWatermark = null;
    currentImageWatermark = null;

    document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ==================== 上传功能 ====================
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

    const triggerUpload = (e) => {
        e.preventDefault();
        fileInput.click();
    };

    uploadBtn.addEventListener('click', triggerUpload);
    uploadBtn.addEventListener('touchend', triggerUpload);
    uploadArea.addEventListener('click', triggerUpload);

    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
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
            <div class="meta">${imgData.exif?.Make || '未知'}</div>
        </div>
        <div class="actions">
            <button onclick="openPreview('${imgData.id}')">✏️</button>
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
    // 文字水印
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
        alert('文字水印已设置');
    };

    // 图片水印
    setupImageWatermark();

    // 边框
    document.getElementById('applyBorderBtn').onclick = applyBorderToAll;

    // 滑块实时更新
    ['fontSize', 'textOpacity', 'borderWidth', 'borderRadius'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updateSliderValues;
    });

    document.getElementById('saveTemplateBtn').onclick = saveCurrentTemplate;
    updateSliderValues();
}

function updateSliderValues() {
    const ids = [
        ['fontSize', 'fontSizeValue'],
        ['textOpacity', 'textOpacityValue'],
        ['borderWidth', 'borderWidthValue'],
        ['borderRadius', 'borderRadiusValue']
    ];
    ids.forEach(([inputId, spanId]) => {
        const input = document.getElementById(inputId);
        const span = document.getElementById(spanId);
        if (input && span) span.textContent = input.value;
    });
}

function setupImageWatermark() {
    const uploadBtn = document.getElementById('uploadImageWatermarkBtn');
    const fileInput = document.getElementById('imageWatermarkInput');
    const preview = document.getElementById('imageWatermarkPreview');
    const thumb = document.getElementById('imageWatermarkThumb');
    const removeBtn = document.getElementById('removeImageWatermarkBtn');

    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                currentImageWatermark = { url: ev.target.result, image: img };
                thumb.src = ev.target.result;
                preview.style.display = 'block';
                uploadBtn.style.display = 'none';
                currentBrand = null;
                currentTextWatermark = null;
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    removeBtn.onclick = () => {
        currentImageWatermark = null;
        preview.style.display = 'none';
        uploadBtn.style.display = 'block';
        fileInput.value = '';
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
    alert('边框已应用到所有图片');
    refreshGrid();
}

// ==================== 预览模态框 ====================
function initModal() {
    const modal = document.getElementById('previewModal');
    document.getElementById('closeModal').onclick = () => modal.classList.remove('show');

    document.getElementById('applyToCurrentBtn').onclick = () => applyToCurrent(true);
    document.getElementById('applyToAllBtn').onclick = () => applyToCurrent(false);

    // 滑块联动
    ['globalOpacity', 'rotation', 'aspectRatio'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = () => {
            if (currentPreviewIndex !== null) {
                const imgData = images[currentPreviewIndex];
                renderPreviewCanvas(imgData);
            }
        };
    });
}

function openPreview(id) {
    const idx = images.findIndex(i => i.id === id);
    if (idx === -1) return;
    currentPreviewIndex = idx;

    const modal = document.getElementById('previewModal');
    modal.classList.add('show');

    const imgData = images[idx];
    const s = imgData.settings || previewSettings;

    // 恢复设置
    document.getElementById('globalOpacity').value = Math.round((s.opacity || 0.85) * 100);
    document.getElementById('rotation').value = s.rotation || 0;
    document.getElementById('aspectRatio').value = s.aspectRatio || 'original';

    updateModalSliders();
    renderPreviewCanvas(imgData);
}

function updateModalSliders() {
    const opacity = document.getElementById('globalOpacity');
    const rot = document.getElementById('rotation');
    document.getElementById('globalOpacityValue').textContent = opacity.value;
    document.getElementById('rotationValue').textContent = rot.value;
}

// ==================== 核心：绘制水印 ====================
async function renderPreviewCanvas(imgData) {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.src = imgData.originalUrl;
    await new Promise(r => img.onload = r);

    // 根据画幅调整画布
    const ratio = document.getElementById('aspectRatio').value;
    let cw = img.width, ch = img.height;

    if (ratio === '16:9') { cw = 900; ch = 506; }
    else if (ratio === '4:3') { cw = 900; ch = 675; }
    else if (ratio === '3:2') { cw = 900; ch = 600; }
    else if (ratio === '1:1') { cw = 700; ch = 700; }
    else if (ratio === '9:16') { cw = 506; ch = 900; }

    canvas.width = cw;
    canvas.height = ch;

    ctx.drawImage(img, 0, 0, cw, ch);

    const settings = getCurrentSettings();
    drawAllWatermarks(ctx, cw, ch, settings, imgData);
}

function getCurrentSettings() {
    return {
        opacity: parseFloat(document.getElementById('globalOpacity').value) / 100,
        rotation: parseFloat(document.getElementById('rotation').value),
        aspectRatio: document.getElementById('aspectRatio').value,
        border: {
            style: document.getElementById('borderStyle').value,
            width: parseInt(document.getElementById('borderWidth').value),
            radius: parseInt(document.getElementById('borderRadius').value),
            color: document.getElementById('borderColor').value
        }
    };
}

function drawAllWatermarks(ctx, w, h, settings, imgData) {
    ctx.save();
    ctx.globalAlpha = settings.opacity;

    // 1. 品牌水印
    if (currentBrand && currentBrand.logo) {
        drawBrandLogo(ctx, w, h, currentBrand, settings);
    }
    // 2. 文字水印
    else if (currentTextWatermark) {
        drawTextWatermark(ctx, w, h, currentTextWatermark, settings);
    }
    // 3. 图片水印
    else if (currentImageWatermark && currentImageWatermark.image) {
        drawImageWatermark(ctx, w, h, currentImageWatermark, settings);
    }

    // 4. 边框
    if (settings.border && settings.border.style !== 'none') {
        drawBorder(ctx, w, h, settings.border);
    }

    ctx.restore();
}

function drawBrandLogo(ctx, canvasW, canvasH, brand, settings) {
    const img = new Image();
    img.src = brand.logo;
    // 简化处理：直接绘制
    const scale = 0.6;
    const logoW = 220 * scale;
    const logoH = 70 * scale;
    const x = canvasW * 0.5 - logoW / 2;
    const y = canvasH * 0.92 - logoH / 2;

    ctx.drawImage(img, x, y, logoW, logoH);
}

function drawTextWatermark(ctx, canvasW, canvasH, wm, settings) {
    ctx.font = `bold ${wm.fontSize}px ${wm.fontFamily}`;
    ctx.fillStyle = wm.color;
    ctx.textAlign = 'center';

    const x = canvasW * 0.5;
    const y = canvasH * 0.92;
    ctx.fillText(wm.text, x, y);
}

function drawImageWatermark(ctx, canvasW, canvasH, wm, settings) {
    const img = wm.image;
    const scale = 0.6;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = canvasW * 0.5 - w / 2;
    const y = canvasH * 0.92 - h / 2;
    ctx.drawImage(img, x, y, w, h);
}

function drawBorder(ctx, w, h, border) {
    ctx.strokeStyle = border.color;
    ctx.lineWidth = border.width;

    if (border.style === 'rect' || border.style === 'rounded') {
        const r = border.style === 'rounded' ? border.radius : 0;
        ctx.beginPath();
        ctx.roundRect(border.width/2, border.width/2, w - border.width, h - border.width, r);
        ctx.stroke();
    } else if (border.style === 'square') {
        const size = Math.min(w, h) - border.width;
        const x = (w - size) / 2;
        const y = (h - size) / 2;
        ctx.strokeRect(x, y, size, size);
    } else if (border.style === 'circle') {
        const r = Math.min(w, h) / 2 - border.width / 2;
        ctx.beginPath();
        ctx.arc(w/2, h/2, r, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ==================== 应用水印 ====================
function applyToCurrent(applyAll = false) {
    const settings = getCurrentSettings();
    const targetImages = applyAll ? images : [images[currentPreviewIndex]];

    targetImages.forEach(img => {
        img.settings = { ...settings };
        if (currentBrand) img.settings.brand = currentBrand;
        if (currentTextWatermark) img.settings.text = currentTextWatermark;
        if (currentImageWatermark) img.settings.imageWm = currentImageWatermark;

        generateProcessedImage(img);
    });

    document.getElementById('previewModal').classList.remove('show');
    setTimeout(() => {
        refreshGrid();
        document.getElementById('downloadAllBtn').disabled = false;
    }, 600);
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

        const s = imgData.settings || {};
        if (s.brand || s.text || s.imageWm) {
            // 简化版绘制
            ctx.globalAlpha = s.opacity || 0.85;
            if (s.brand) drawBrandLogo(ctx, img.width, img.height, s.brand, s);
            if (s.text) drawTextWatermark(ctx, img.width, img.height, s.text, s);
            if (s.imageWm) drawImageWatermark(ctx, img.width, img.height, s.imageWm, s);
        }
        if (s.border && s.border.style !== 'none') {
            drawBorder(ctx, img.width, img.height, s.border);
        }
        imgData.processedUrl = canvas.toDataURL('image/jpeg', 0.92);
    };
}

// ==================== 其他功能 ====================
function downloadSingle(id) {
    const img = images.find(i => i.id === id);
    if (!img) return;
    const link = document.createElement('a');
    link.download = `watermarked_${img.file.name}`;
    link.href = img.processedUrl || img.originalUrl;
    link.click();
}

async function downloadAllAsZip() {
    const zip = new JSZip();
    for (const img of images) {
        const url = img.processedUrl || img.originalUrl;
        const blob = await (await fetch(url)).blob();
        zip.file(`watermarked_${img.file.name}`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `watermarked_${Date.now()}.zip`;
    link.click();
}

function deleteImage(id, btn) {
    images = images.filter(i => i.id !== id);
    btn.closest('.image-card').remove();
    document.getElementById('imageCount').textContent = `${images.length} 张照片`;
}

function clearAll() {
    if (!confirm('确定清空吗？')) return;
    images = [];
    document.getElementById('gridContainer').innerHTML = '';
    document.getElementById('imagesGrid').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
}

function saveCurrentTemplate() {
    const name = prompt('模板名称', '我的水印模板');
    if (!name) return;

    const template = {
        name,
        brand: currentBrand,
        text: currentTextWatermark,
        imageWm: currentImageWatermark ? true : false,
        border: {
            style: document.getElementById('borderStyle').value,
            width: document.getElementById('borderWidth').value,
            radius: document.getElementById('borderRadius').value,
            color: document.getElementById('borderColor').value
        },
        timestamp: Date.now()
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
        div.innerHTML = `
            <span>${tpl.name}</span>
            <button onclick="event.stopImmediatePropagation();deleteTemplate(${index},this)">×</button>
        `;
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
}

// ==================== 启动 ====================
window.onload = init;