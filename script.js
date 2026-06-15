// 水印边框大师 Web版 - 核心脚本

let images = []; // 存储所有图片 {id, file, originalUrl, processedUrl, exif, watermarkSettings}
let currentPreviewIndex = null;
let currentBrandWatermark = null;
let currentCustomWatermark = null;
let currentImageWatermark = null; // 新增：图片水印

// 品牌水印配置（扩展版）
const brandTemplates = [
    { id: 'sony', name: 'Sony', color: '#ffffff', font: 'Arial' },
    { id: 'leica', name: 'Leica', color: '#ffffff', font: 'Georgia' },
    { id: 'hasselblad', name: 'Hasselblad', color: '#ffffff', font: 'Georgia' },
    { id: 'canon', name: 'Canon', color: '#ffffff', font: 'Arial' },
    { id: 'nikon', name: 'Nikon', color: '#ffffff', font: 'Arial' },
    { id: 'fujifilm', name: 'Fujifilm', color: '#ffffff', font: 'Arial' },
    { id: 'panasonic', name: 'Panasonic', color: '#ffffff', font: 'Arial' },
    { id: 'olympus', name: 'Olympus', color: '#ffffff', font: 'Arial' },
    { id: 'pentax', name: 'Pentax', color: '#ffffff', font: 'Arial' },
    { id: 'ricoh', name: 'Ricoh', color: '#ffffff', font: 'Arial' },
    { id: 'phaseone', name: 'Phase One', color: '#ffffff', font: 'Georgia' },
    { id: 'mamiya', name: 'Mamiya', color: '#ffffff', font: 'Georgia' }
];

// 初始化
function init() {
    // 品牌模板按钮
    const brandContainer = document.getElementById('brandTemplates');
    brandTemplates.forEach(brand => {
        const btn = document.createElement('button');
        btn.className = 'brand-btn';
        btn.textContent = brand.name;
        btn.onclick = () => selectBrandWatermark(brand);
        brandContainer.appendChild(btn);
    });

    // 上传相关（手机优化版）
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

    // 手机端优化：使用 touch 事件 + click
    const triggerFileSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    };

    uploadBtn.addEventListener('click', triggerFileSelect);
    uploadBtn.addEventListener('touchend', triggerFileSelect);

    uploadArea.addEventListener('click', triggerFileSelect);
    uploadArea.addEventListener('touchend', triggerFileSelect);

    // 拖拽（桌面）
    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    // 自定义水印
    document.getElementById('addCustomBtn').onclick = addCustomWatermark;
    document.getElementById('fontSize').oninput = updateSliderValues;
    document.getElementById('opacity').oninput = updateSliderValues;

    // 边框
    document.getElementById('applyBorderBtn').onclick = applyBorderToAll;
    document.getElementById('borderWidth').oninput = updateSliderValues;

    // 批量操作
    document.getElementById('processAllBtn').onclick = processAllImages;
    document.getElementById('downloadAllBtn').onclick = downloadAllAsZip;
    document.getElementById('clearAllBtn').onclick = clearAll;

    // 保存模板
    document.getElementById('saveTemplateBtn').onclick = saveCurrentTemplate;

    // 图片水印上传
    setupImageWatermarkUpload();

    // PWA 支持
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
    }

    // 模态框控制
    setupModalControls();

    updateSliderValues();
    loadSavedTemplates();
}

// 滑块值显示
function updateSliderValues() {
    const fontSize = document.getElementById('fontSize');
    const opacity = document.getElementById('opacity');
    const borderWidth = document.getElementById('borderWidth');

    document.getElementById('fontSizeValue').textContent = fontSize.value;
    document.getElementById('opacityValue').textContent = Math.round(opacity.value * 100) + '%';
    document.getElementById('borderWidthValue').textContent = borderWidth.value + 'px';
}

// 选择品牌水印
function selectBrandWatermark(brand) {
    currentBrandWatermark = brand;
    currentCustomWatermark = null;
    
    // 高亮选中
    document.querySelectorAll('.brand-btn').forEach(b => b.style.border = '1px solid #334155');
    event.target.style.border = '2px solid #4f46e5';
    
    alert(`已选择 ${brand.name} 水印模板！\n接下来上传图片或点击「批量添加水印」`);
}

// 添加自定义文字水印
function addCustomWatermark() {
    const text = document.getElementById('customText').value.trim();
    if (!text) {
        alert('请输入水印文字');
        return;
    }
    
    currentCustomWatermark = {
        text: text,
        fontSize: parseInt(document.getElementById('fontSize').value),
        opacity: parseFloat(document.getElementById('opacity').value),
        color: document.getElementById('textColor').value
    };
    currentBrandWatermark = null;
    currentImageWatermark = null;
    
    alert('文字水印已设置！');
}

// 设置图片水印上传功能
function setupImageWatermarkUpload() {
    const uploadBtn = document.getElementById('uploadImageWatermarkBtn');
    const fileInput = document.getElementById('imageWatermarkInput');
    const previewDiv = document.getElementById('imageWatermarkPreview');
    const thumb = document.getElementById('imageWatermarkThumb');
    const removeBtn = document.getElementById('removeImageWatermarkBtn');

    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            currentImageWatermark = {
                url: ev.target.result,
                image: null // 稍后加载
            };
            
            // 预加载图片
            const img = new Image();
            img.onload = () => {
                currentImageWatermark.image = img;
            };
            img.src = ev.target.result;

            // 显示预览
            thumb.src = ev.target.result;
            previewDiv.style.display = 'block';
            uploadBtn.style.display = 'none';
            
            currentBrandWatermark = null;
            currentCustomWatermark = null;
        };
        reader.readAsDataURL(file);
    };

    removeBtn.onclick = () => {
        currentImageWatermark = null;
        previewDiv.style.display = 'none';
        uploadBtn.style.display = 'block';
        fileInput.value = '';
    };
}

// 应用边框
function applyBorderToAll() {
    const width = parseInt(document.getElementById('borderWidth').value);
    const color = document.getElementById('borderColor').value;
    
    if (width === 0) {
        alert('请先设置边框宽度');
        return;
    }
    
    images.forEach(img => {
        if (!img.watermarkSettings) img.watermarkSettings = {};
        img.watermarkSettings.border = { width, color };
    });
    
    alert(`已为所有图片添加 ${width}px 边框`);
    refreshGrid();
}

// 处理上传的文件
async function handleFiles(fileList) {
    const uploadArea = document.getElementById('uploadArea');
    const grid = document.getElementById('imagesGrid');
    
    uploadArea.style.display = 'none';
    grid.style.display = 'block';
    
    const files = Array.from(fileList).slice(0, 50); // 限制50张
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        
        // 读取 EXIF
        let exif = {};
        try {
            exif = await exifr.parse(file, { gps: false });
        } catch (e) {
            console.log('EXIF读取失败', e);
        }
        
        const imgData = {
            id,
            file,
            originalUrl: url,
            processedUrl: null,
            exif,
            watermarkSettings: null
        };
        
        images.push(imgData);
        renderImageCard(imgData);
    }
    
    document.getElementById('imageCount').textContent = `已加载 ${images.length} 张图片`;
}

// 渲染单张图片卡片
function renderImageCard(imgData) {
    const container = document.getElementById('gridContainer');
    
    const card = document.createElement('div');
    card.className = 'image-card';
    card.dataset.id = imgData.id;
    
    const imgHTML = imgData.processedUrl 
        ? `<img src="${imgData.processedUrl}" alt="processed">`
        : `<img src="${imgData.originalUrl}" alt="original">`;
    
    card.innerHTML = `
        ${imgHTML}
        <div class="info">
            <div>${imgData.file.name}</div>
            <div style="font-size:0.75rem;color:#64748b;">
                ${imgData.exif?.Make || '未知相机'}
            </div>
        </div>
        <div class="actions">
            <button title="预览/编辑" onclick="openPreview('${imgData.id}')">✏️</button>
            <button title="下载" onclick="downloadSingle('${imgData.id}')">⬇️</button>
            <button title="删除" onclick="deleteImage('${imgData.id}', this)">🗑️</button>
        </div>
    `;
    
    container.appendChild(card);
}

// 刷新整个网格
function refreshGrid() {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    images.forEach(img => renderImageCard(img));
}

// 打开预览模态框
function openPreview(id) {
    const imgData = images.find(i => i.id === id);
    if (!imgData) return;
    
    currentPreviewIndex = images.findIndex(i => i.id === id);
    
    const modal = document.getElementById('previewModal');
    modal.classList.add('show');
    
    // 初始化滑块值
    const settings = imgData.watermarkSettings || {};
    document.getElementById('posX').value = settings.posX || 50;
    document.getElementById('posY').value = settings.posY || 90;
    document.getElementById('scale').value = settings.scale || 1;
    document.getElementById('rotation').value = settings.rotation || 0;
    document.getElementById('previewOpacity').value = settings.opacity || 0.85;
    
    updatePreviewSliders();
    renderPreviewCanvas(imgData);
    
    // 绑定滑块事件
    const sliders = ['posX', 'posY', 'scale', 'rotation', 'previewOpacity'];
    sliders.forEach(s => {
        const el = document.getElementById(s);
        el.oninput = () => {
            updatePreviewSliders();
            renderPreviewCanvas(imgData);
        };
    });
}

// 更新预览滑块显示
function updatePreviewSliders() {
    document.getElementById('posXValue').textContent = document.getElementById('posX').value + '%';
    document.getElementById('posYValue').textContent = document.getElementById('posY').value + '%';
    document.getElementById('scaleValue').textContent = parseFloat(document.getElementById('scale').value).toFixed(1) + 'x';
    document.getElementById('rotationValue').textContent = document.getElementById('rotation').value + '°';
    document.getElementById('previewOpacityValue').textContent = Math.round(document.getElementById('previewOpacity').value * 100) + '%';
}

// 绘制预览 Canvas
async function renderPreviewCanvas(imgData) {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.src = imgData.originalUrl;
    
    await new Promise(r => img.onload = r);
    
    // 保持比例
    const maxW = 600, maxH = 400;
    let w = img.width;
    let h = img.height;
    
    if (w > maxW) {
        h = h * maxW / w;
        w = maxW;
    }
    if (h > maxH) {
        w = w * maxH / h;
        h = maxH;
    }
    
    canvas.width = w;
    canvas.height = h;
    
    ctx.drawImage(img, 0, 0, w, h);
    
    // 绘制水印
    const settings = getCurrentPreviewSettings();
    drawWatermarkOnCanvas(ctx, w, h, settings, imgData);
}

// 获取当前预览设置
function getCurrentPreviewSettings() {
    return {
        posX: parseFloat(document.getElementById('posX').value),
        posY: parseFloat(document.getElementById('posY').value),
        scale: parseFloat(document.getElementById('scale').value),
        rotation: parseFloat(document.getElementById('rotation').value),
        opacity: parseFloat(document.getElementById('previewOpacity').value),
        border: null // 可扩展
    };
}

// 在 Canvas 上绘制水印（支持文字 + 图片水印）
function drawWatermarkOnCanvas(ctx, canvasW, canvasH, settings, imgData) {
    ctx.save();
    
    // 优先级：图片水印 > 文字/品牌水印
    if (currentImageWatermark && currentImageWatermark.image) {
        // 绘制图片水印
        const img = currentImageWatermark.image;
        const scale = settings.scale || 1;
        const opacity = settings.opacity || 0.85;
        
        ctx.globalAlpha = opacity;
        
        const w = img.width * scale;
        const h = img.height * scale;
        
        const x = canvasW * (settings.posX / 100) - w / 2;
        const y = canvasH * (settings.posY / 100) - h / 2;
        
        ctx.translate(x + w/2, y + h/2);
        ctx.rotate((settings.rotation || 0) * Math.PI / 180);
        ctx.drawImage(img, -w/2, -h/2, w, h);
        
    } else {
        // 文字水印
        let watermarkText = '';
        let fontSize = 24;
        let color = '#ffffff';
        
        if (currentBrandWatermark) {
            watermarkText = currentBrandWatermark.name;
            fontSize = 28;
            color = '#ffffff';
        } else if (currentCustomWatermark) {
            watermarkText = currentCustomWatermark.text;
            fontSize = currentCustomWatermark.fontSize;
            color = currentCustomWatermark.color;
        } else if (imgData.watermarkSettings?.text) {
            watermarkText = imgData.watermarkSettings.text;
            fontSize = imgData.watermarkSettings.fontSize || 24;
            color = imgData.watermarkSettings.color || '#ffffff';
        } else {
            watermarkText = imgData.exif?.Make || 'Watermark';
        }
        
        ctx.globalAlpha = settings.opacity;
        ctx.font = `bold ${fontSize * settings.scale}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        
        const x = canvasW * (settings.posX / 100);
        const y = canvasH * (settings.posY / 100);
        
        ctx.translate(x, y);
        ctx.rotate(settings.rotation * Math.PI / 180);
        ctx.fillText(watermarkText, 0, 0);
    }
    
    // 绘制边框（如果有）
    if (imgData.watermarkSettings?.border) {
        const b = imgData.watermarkSettings.border;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.width;
        ctx.strokeRect(0, 0, canvasW, canvasH);
    }
    
    ctx.restore();
}

// 应用到当前图片
function applyToCurrent() {
    if (currentPreviewIndex === null) return;
    
    const imgData = images[currentPreviewIndex];
    const settings = getCurrentPreviewSettings();
    
    // 保存当前水印类型
    if (currentBrandWatermark) {
        settings.brand = currentBrandWatermark.id;
    } else if (currentCustomWatermark) {
        settings.custom = currentCustomWatermark;
    }
    
    imgData.watermarkSettings = settings;
    
    // 生成处理后的图片
    generateProcessedImage(imgData);
    
    document.getElementById('previewModal').classList.remove('show');
    refreshGrid();
}

// 应用到所有图片
function applyToAll() {
    const settings = getCurrentPreviewSettings();
    
    images.forEach(img => {
        img.watermarkSettings = { ...settings };
        if (currentBrandWatermark) img.watermarkSettings.brand = currentBrandWatermark.id;
        if (currentCustomWatermark) img.watermarkSettings.custom = currentCustomWatermark;
        generateProcessedImage(img);
    });
    
    document.getElementById('previewModal').classList.remove('show');
    refreshGrid();
}

// 生成处理后的图片（Canvas转DataURL）
function generateProcessedImage(imgData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.src = imgData.originalUrl;
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const settings = imgData.watermarkSettings || {};
        
        // 绘制水印
        if (currentBrandWatermark || currentCustomWatermark || settings.text) {
            drawWatermarkOnCanvas(ctx, img.width, img.height, settings, imgData);
        }
        
        // 边框
        if (settings.border) {
            ctx.strokeStyle = settings.border.color;
            ctx.lineWidth = settings.border.width;
            ctx.strokeRect(0, 0, img.width, img.height);
        }
        
        imgData.processedUrl = canvas.toDataURL('image/jpeg', 0.92);
    };
}

// 批量处理所有图片
function processAllImages() {
    if (images.length === 0) {
        alert('请先上传图片');
        return;
    }
    
    let processed = 0;
    images.forEach(img => {
        if (!img.watermarkSettings) {
            // 自动使用当前水印或EXIF
            img.watermarkSettings = {
                posX: 50,
                posY: 92,
                scale: 1,
                rotation: 0,
                opacity: 0.85
            };
            if (currentBrandWatermark) img.watermarkSettings.brand = currentBrandWatermark.id;
            if (currentCustomWatermark) img.watermarkSettings.custom = currentCustomWatermark;
        }
        generateProcessedImage(img);
        processed++;
    });
    
    setTimeout(() => {
        refreshGrid();
        alert(`已处理 ${processed} 张图片！`);
        document.getElementById('downloadAllBtn').disabled = false;
    }, 800);
}

// 下载单张
function downloadSingle(id) {
    const imgData = images.find(i => i.id === id);
    if (!imgData) return;
    
    const link = document.createElement('a');
    link.download = `watermarked_${imgData.file.name}`;
    link.href = imgData.processedUrl || imgData.originalUrl;
    link.click();
}

// 下载全部为ZIP
async function downloadAllAsZip() {
    if (images.length === 0) return;
    
    const zip = new JSZip();
    let count = 0;
    
    for (const img of images) {
        const url = img.processedUrl || img.originalUrl;
        const response = await fetch(url);
        const blob = await response.blob();
        
        const filename = `watermarked_${img.file.name}`;
        zip.file(filename, blob);
        count++;
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `watermarked_images_${Date.now()}.zip`;
    link.click();
    
    alert(`已打包下载 ${count} 张图片！`);
}

// 删除图片
function deleteImage(id, btn) {
    if (!confirm('确定删除这张图片吗？')) return;
    
    images = images.filter(i => i.id !== id);
    btn.closest('.image-card').remove();
    document.getElementById('imageCount').textContent = `已加载 ${images.length} 张图片`;
}

// 清空所有
function clearAll() {
    if (!confirm('确定清空所有图片吗？')) return;
    
    images = [];
    document.getElementById('gridContainer').innerHTML = '';
    document.getElementById('imagesGrid').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('downloadAllBtn').disabled = true;
}

// 保存当前模板
function saveCurrentTemplate() {
    const name = prompt('请输入模板名称：', '我的水印模板');
    if (!name) return;
    
    const template = {
        name,
        brand: currentBrandWatermark,
        custom: currentCustomWatermark,
        border: {
            width: parseInt(document.getElementById('borderWidth').value),
            color: document.getElementById('borderColor').value
        },
        timestamp: Date.now()
    };
    
    let saved = JSON.parse(localStorage.getItem('watermarkTemplates') || '[]');
    saved.push(template);
    localStorage.setItem('watermarkTemplates', JSON.stringify(saved));
    
    loadSavedTemplates();
    alert('模板已保存！');
}

// 加载保存的模板
function loadSavedTemplates() {
    const container = document.getElementById('myTemplates');
    container.innerHTML = '';
    
    const saved = JSON.parse(localStorage.getItem('watermarkTemplates') || '[]');
    
    saved.forEach((tpl, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background:#334155;padding:8px;border-radius:6px;margin-bottom:6px;cursor:pointer;font-size:0.85rem';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center">
                <span>${tpl.name}</span>
                <button onclick="event.stopImmediatePropagation();deleteTemplate(${index}, this)">×</button>
            </div>
        `;
        div.onclick = () => loadTemplate(tpl);
        container.appendChild(div);
    });
}

function deleteTemplate(index, el) {
    let saved = JSON.parse(localStorage.getItem('watermarkTemplates') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('watermarkTemplates', JSON.stringify(saved));
    el.parentElement.parentElement.remove();
}

function loadTemplate(tpl) {
    if (tpl.brand) {
        currentBrandWatermark = tpl.brand;
        currentCustomWatermark = null;
    }
    if (tpl.custom) {
        currentCustomWatermark = tpl.custom;
        currentBrandWatermark = null;
    }
    if (tpl.border) {
        document.getElementById('borderWidth').value = tpl.border.width;
        document.getElementById('borderColor').value = tpl.border.color;
        updateSliderValues();
    }
    alert(`模板「${tpl.name}」已加载`);
}

// 模态框控制
function setupModalControls() {
    const modal = document.getElementById('previewModal');
    
    document.getElementById('closeModal').onclick = () => modal.classList.remove('show');
    
    document.getElementById('applyToCurrentBtn').onclick = applyToCurrent;
    document.getElementById('applyToAllBtn').onclick = applyToAll;
    
    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('show');
    };
    
    // 键盘 ESC 关闭
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });
}

// 启动应用
window.onload = init;