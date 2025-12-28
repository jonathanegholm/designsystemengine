// --- CONSTANTS ---
const STOPS = [
    { name: '50', l: 0.98 }, { name: '100', l: 0.95 }, { name: '200', l: 0.90 },
    { name: '300', l: 0.82 }, { name: '400', l: 0.74 }, { name: '500', l: 0.64 },
    { name: '600', l: 0.54 }, { name: '700', l: 0.44 }, { name: '800', l: 0.35 },
    { name: '900', l: 0.26 }, { name: '1100', l: 0.15 }
];

const PRESETS = [
    { name: 'Zinc', h: 240, c: 0.005 }, { name: 'Red', h: 25, c: 0.16 },
    { name: 'Orange', h: 45, c: 0.16 }, { name: 'Amber', h: 85, c: 0.16 },
    { name: 'Emerald', h: 160, c: 0.14 }, { name: 'Cyan', h: 200, c: 0.12 },
    { name: 'Blue', h: 250, c: 0.14 }, { name: 'Indigo', h: 280, c: 0.14 },
    { name: 'Violet', h: 300, c: 0.14 }, { name: 'Pink', h: 340, c: 0.14 }
];

// Extended Surface Definitions with specific shades for "Raised" mode
const SURFACES = [
    {
        name: 'Zinc',
        light: { bg: '0 0% 100%', card: '0 0% 100%' },
        dark: { bg: '240 10% 3.9%', card: '240 10% 3.9%' },
        raised: { lightBg: '240 4.8% 96%', darkBg: '240 10% 3.9%', darkCard: '240 5.9% 9%' }
    },
    {
        name: 'Slate',
        light: { bg: '0 0% 100%', card: '0 0% 100%' },
        dark: { bg: '222.2 84% 3.9%', card: '222.2 84% 3.9%' },
        raised: { lightBg: '210 40% 96.1%', darkBg: '222.2 84% 3.9%', darkCard: '215 25% 9%' }
    },
    {
        name: 'Stone',
        light: { bg: '0 0% 100%', card: '0 0% 100%' },
        dark: { bg: '24 9.8% 3.9%', card: '24 9.8% 3.9%' },
        raised: { lightBg: '60 9.1% 97.8%', darkBg: '24 9.8% 3.9%', darkCard: '24 5.4% 9%' }
    },
    {
        name: 'Gray',
        light: { bg: '0 0% 100%', card: '0 0% 100%' },
        dark: { bg: '224 71% 3.9%', card: '224 71% 3.9%' },
        raised: { lightBg: '220 14% 96%', darkBg: '224 71% 3.9%', darkCard: '215 19% 9%' }
    },
    {
        name: 'Neutral',
        light: { bg: '0 0% 100%', card: '0 0% 100%' },
        dark: { bg: '0 0% 3.9%', card: '0 0% 3.9%' },
        raised: { lightBg: '0 0% 96%', darkBg: '0 0% 3.9%', darkCard: '0 0% 9%' }
    },

];


const STORAGE_KEY = 'design-system-presets';

// --- STATE ---
let state = { hue: 250, chroma: 0.14, baseColor: null, surfaceLevel: 'flat', borderRadius: 'default', buttonStyle: 'flat', shadows: 'default', fontFamily: 'Inter, sans-serif' };
let currentSurface = SURFACES[0];
let currentScaleValues = {};
let userPresets = {};


// --- MATH UTILS ---
function hexToOklch(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255; let g = (bigint >> 8) & 255; let b = bigint & 255;
    r /= 255; g /= 255; b /= 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const C = Math.sqrt(Math.pow(1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_, 2) + Math.pow(0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_, 2));
    const H = Math.atan2(0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_, 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_) * 180 / Math.PI;
    return { l: parseFloat(L.toFixed(3)), c: parseFloat(C.toFixed(3)), h: parseFloat((H < 0 ? H + 360 : H).toFixed(2)) };
}

function oklchToSrgb(l, c, h) {
    h = h * Math.PI / 180;
    const L = l;
    const a = c * Math.cos(h);
    const b = c * Math.sin(h);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l__ = l_ * l_ * l_;
    const m__ = m_ * m_ * m_;
    const s__ = s_ * s_ * s_;

    let r = 4.0767416621 * l__ - 3.3077115913 * m__ + 0.2309699292 * s__;
    let g = -1.2684380046 * l__ + 2.6097574011 * m__ - 0.3413193965 * s__;
    let bl = -0.0041960863 * l__ - 0.7034186147 * m__ + 1.7076147010 * s__;

    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    bl = bl > 0.0031308 ? 1.055 * Math.pow(bl, 1 / 2.4) - 0.055 : 12.92 * bl;

    r = Math.min(Math.max(0, r), 1);
    g = Math.min(Math.max(0, g), 1);
    bl = Math.min(Math.max(0, bl), 1);

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(bl * 255) };
}

function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1, rgb2) {
    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    if (l1 > l2) return (l1 + 0.05) / (l2 + 0.05);
    return (l2 + 0.05) / (l1 + 0.05);
}

// --- DOM REFS ---
const root = document.documentElement;
const dom = {
    hue: document.getElementById('slider-hue'),
    chroma: document.getElementById('slider-chroma'),
    hueVal: document.getElementById('val-hue'),
    chromaVal: document.getElementById('val-chroma'),
    hex: document.getElementById('input-hex'),
    picker: document.getElementById('input-color-picker'),
    preview: document.getElementById('preview-swatch'),
    warning: document.getElementById('hex-warning'),
    scale: document.getElementById('scale-container'),
    presets: document.getElementById('preset-container'),
    surfaceContainer: document.getElementById('surface-container'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    toastBg: document.getElementById('toast-bg'),
    toastIcon: document.getElementById('toast-icon'),
    fileImport: document.getElementById('file-import'),
    btnImport: document.getElementById('btn-import-json'),
    saveDialog: document.getElementById('save-dialog'),
    btnSaveTrigger: document.getElementById('btn-save-modal-trigger'),
    btnCancelSave: document.getElementById('btn-cancel-save'),
    btnConfirmSave: document.getElementById('btn-confirm-save'),
    btnCloseSaveDialog: document.getElementById('btn-close-save-dialog'),
    saveNameInput: document.getElementById('save-name'),
    deleteDialog: document.getElementById('delete-dialog'),
    btnDeleteTrigger: document.getElementById('btn-delete-trigger'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    deleteTargetName: document.getElementById('delete-target-name'),
    savedPresetsSelect: document.getElementById('saved-presets-select'),
    fontFamilySelect: document.getElementById('font-family-select'),
    // Level
    btnLevelFlat: document.getElementById('btn-level-flat'),
    btnLevelRaised: document.getElementById('btn-level-raised'),
    // Border Radius
    btnRadiusNone: document.getElementById('btn-radius-none'),
    btnRadiusDefault: document.getElementById('btn-radius-default'),
    btnRadiusRounded: document.getElementById('btn-radius-rounded'),
    btnRadiusFull: document.getElementById('btn-radius-full'),
    // Button Style
    btnStyleFlat: document.getElementById('btn-style-flat'),
    btnStyleGradient: document.getElementById('btn-style-gradient'),
    btnStyleBevel: document.getElementById('btn-style-bevel'),
    // Shadows
    btnShadowNone: document.getElementById('btn-shadow-none'),
    btnShadowDefault: document.getElementById('btn-shadow-default'),
    btnShadowLarge: document.getElementById('btn-shadow-large'),
};

// --- CORE UI UPDATES ---
function showToast(msg, isError = false) {
    dom.toastMsg.innerText = msg;
    if (isError) {
        dom.toastBg.classList.remove('bg-[var(--color-900)]', 'text-[var(--color-50)]');
        dom.toastBg.classList.add('bg-red-600', 'text-white');
        dom.toastIcon.setAttribute('data-lucide', 'alert-circle');
    } else {
        dom.toastBg.classList.add('bg-[var(--color-900)]', 'text-[var(--color-50)]');
        dom.toastBg.classList.remove('bg-red-600', 'text-white');
        dom.toastIcon.setAttribute('data-lucide', 'check');
    }
    lucide.createIcons();
    dom.toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => dom.toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

function copyToClipboard(text, msg = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => showToast(msg));
}

function updateUI() {
    currentScaleValues = {};
    STOPS.forEach(stop => {
        let adjChroma = state.chroma;
        if (stop.l > 0.92) adjChroma = state.chroma * 0.5;
        if (stop.l < 0.2) adjChroma = state.chroma * 0.8;
        const val = `oklch(${stop.l} ${adjChroma.toFixed(3)} ${state.hue})`;
        root.style.setProperty(`--color-${stop.name}`, val);
        currentScaleValues[stop.name] = val;
    });

    dom.hueVal.innerText = state.hue.toFixed(0);
    dom.chromaVal.innerText = state.chroma.toFixed(3);
    dom.hue.value = state.hue;
    dom.chroma.value = state.chroma;
    dom.chroma.style.background = `linear-gradient(to right, #e2e8f0, oklch(0.6 0.3 ${state.hue}))`;

    if (!dom.hex.value) dom.preview.style.backgroundColor = `oklch(0.64 ${state.chroma} ${state.hue})`;

    renderScale();
    renderChart();
    updateChartTheme();
    window.dispatchEvent(new CustomEvent('colorChange', { detail: { hue: state.hue, chroma: state.chroma } }));
}

function renderScale() {
    let nearestStop = null;
    if (state.baseColor) {
        nearestStop = STOPS.reduce((prev, curr) => Math.abs(curr.l - state.baseColor.l) < Math.abs(prev.l - state.baseColor.l) ? curr : prev);
    }

    dom.scale.innerHTML = STOPS.map(stop => {
        const isNearest = nearestStop && stop.name === nearestStop.name;

        // Calculate Contrast
        let adjChroma = state.chroma;
        if (stop.l > 0.92) adjChroma = state.chroma * 0.5;
        if (stop.l < 0.2) adjChroma = state.chroma * 0.8;
        const rgb = oklchToSrgb(stop.l, adjChroma, state.hue);

        const white = { r: 255, g: 255, b: 255 };
        const black = { r: 0, g: 0, b: 0 };
        const contrastWhite = getContrast(rgb, white);
        const contrastBlack = getContrast(rgb, black);

        let useWhite = false;
        let ratio = 0;

        if (contrastWhite >= 4.5) {
            useWhite = true;
            ratio = contrastWhite;
        } else if (contrastBlack >= 4.5) {
            useWhite = false;
            ratio = contrastBlack;
        } else {
            // Pick the best available
            if (contrastWhite > contrastBlack) {
                useWhite = true;
                ratio = contrastWhite;
            } else {
                useWhite = false;
                ratio = contrastBlack;
            }
        }

        const textClass = useWhite ? 'text-white/70' : 'text-black/70';
        const iconClass = useWhite ? 'text-white/50' : 'text-black/50';

        let marker = '';
        if (isNearest) {
            marker = `
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-900)] text-[var(--color-50)] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-20">BASE</div>
            <div class="absolute inset-0 ring-2 ring-[var(--color-900)] ring-inset z-10 rounded pointer-events-none opacity-50"></div>
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-white/50 shadow-md z-20" style="background-color: ${state.baseColor.hex}" title="Your Input"></div>
           `;
        }

        return `
        <div onclick="copyToClipboard(currentScaleValues['${stop.name}'])" 
             class="group relative h-full flex flex-col items-center justify-end pb-2 cursor-pointer transition-transform hover:scale-105 hover:z-10 hover:shadow-lg ${isNearest ? 'z-10' : ''}"
             style="background-color: var(--color-${stop.name})">
             ${marker}
             <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i data-lucide="copy" class="w-4 h-4 ${iconClass}"></i>
             </div>
             <span class="text-[10px] font-mono font-bold leading-tight ${textClass}">${stop.name}</span>
             <span class="text-[9px] font-mono opacity-60 leading-tight ${textClass} hidden md:block">${ratio.toFixed(1)}:1</span>
        </div>`;
    }).join('');
    lucide.createIcons();
}

// --- CHART ---
function renderChart() {
    const container = document.getElementById('chart-container');
    if (!container) return;
    const data = [400, 300, 550, 480, 690, 800];
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const max = 850;
    const pts = data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((d / max) * h);
        return `${x},${y}`;
    });
    let d = `M ${pts[0]}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i].split(',').map(Number);
        const [x1, y1] = pts[i + 1].split(',').map(Number);
        const cp1x = x0 + (x1 - x0) / 2;
        const cp2x = x1 - (x1 - x0) / 2;
        d += ` C ${cp1x},${y0} ${cp2x},${y1} ${x1},${y1}`;
    }
    const dFill = `${d} L ${w},${h} L 0,${h} Z`;
    const svg = `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="overflow-visible"><defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--color-600)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--color-600)" stop-opacity="0"/></linearGradient></defs><path d="${dFill}" fill="url(#chartGradient)" /><path d="${d}" fill="none" stroke="var(--color-600)" stroke-width="2" />${pts.map((p, i) => { const [cx, cy] = p.split(','); return `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--color-background)" stroke="var(--color-600)" stroke-width="2" class="chart-dot" data-val="${data[i]}" />` }).join('')}</svg>`;
    container.innerHTML = svg + '<div id="chart-tooltip" class="chart-tooltip"></div>';
    const dots = container.querySelectorAll('.chart-dot');
    const tooltip = document.getElementById('chart-tooltip');
    dots.forEach(dot => {
        dot.addEventListener('mouseenter', (e) => {
            tooltip.textContent = `$${e.target.getAttribute('data-val')}`;
            tooltip.style.opacity = '1';
            const r = e.target.getBoundingClientRect();
            const c = container.getBoundingClientRect();
            tooltip.style.left = `${(r.left - c.left) - 10}px`;
            tooltip.style.top = `${(r.top - c.top) - 35}px`;
        });
        dot.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
    });
}
window.addEventListener('resize', renderChart);

// --- LOCAL STORAGE & PRESETS ---
function initSavedPresets() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) userPresets = JSON.parse(stored);
    } catch (e) { }
    renderSavedPresetsDropdown();
}

function saveScale() {
    const name = dom.saveNameInput.value.trim();
    if (!name) { showToast('Please enter a preset name', true); return; }
    userPresets[name] = { hue: state.hue, chroma: state.chroma };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
    renderSavedPresetsDropdown();
    dom.saveDialog.close();
    dom.savedPresetsSelect.value = name;
    dom.btnDeleteTrigger.classList.remove('hidden');
    showToast('Preset saved!');
}

function confirmDeletePreset() {
    const name = dom.savedPresetsSelect.value;
    if (!name) return;
    delete userPresets[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
    renderSavedPresetsDropdown();
    dom.deleteDialog.close();
    showToast('Preset deleted.');
}

function renderSavedPresetsDropdown() {
    dom.savedPresetsSelect.innerHTML = '<option value="">-- Select Saved Scale --</option>';
    for (const name in userPresets) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        dom.savedPresetsSelect.appendChild(opt);
    }
    if (!dom.savedPresetsSelect.value) dom.btnDeleteTrigger.classList.add('hidden');
}

// --- SURFACES & LEVELS ---
window.setSurfaceLevel = function (level) {
    state.surfaceLevel = level;
    updateSurface();
}

function renderSurfaceLevels() {
    if (state.surfaceLevel === 'flat') {
        dom.btnLevelFlat.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnLevelFlat.classList.remove('hover:bg-accent');
        dom.btnLevelRaised.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnLevelRaised.classList.add('hover:bg-accent');
    } else {
        dom.btnLevelRaised.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnLevelRaised.classList.remove('hover:bg-accent');
        dom.btnLevelFlat.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnLevelFlat.classList.add('hover:bg-accent');
    }
}

function renderSurfaces() {
    dom.surfaceContainer.innerHTML = SURFACES.map(s => {
        const isActive = currentSurface.name === s.name;
        const activeClass = isActive ? 'border-[var(--color-600)] text-[var(--color-600)] border-2' : 'hover:bg-accent border-input';

        let dotColor = `hsl(${s.dark.bg})`;


        return `<button onclick="applySurface('${s.name}')" class="flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs transition-colors ${activeClass}"><div class="w-2.5 h-2.5 rounded-full border border-white/20" style="background-color: ${dotColor}"></div>${s.name}</button>`
    }).join('');
}

window.applySurface = function (name) {
    currentSurface = SURFACES.find(s => s.name === name);
    updateSurface();
}

function updateSurface() {
    const isDark = root.classList.contains('dark');
    const theme = isDark ? currentSurface.dark : currentSurface.light;

    // Default "Flat" values
    let bg = theme.bg;
    let card = theme.card;

    // "Raised" Overrides
    if (state.surfaceLevel === 'raised') {
        if (isDark) {
            bg = currentSurface.raised.darkBg; // 1100 level
            card = currentSurface.raised.darkCard; // 900 level
        } else {
            bg = currentSurface.raised.lightBg; // 100 level
            card = '0 0% 100%'; // Pure White
        }
    }



    root.style.setProperty('--background', bg);
    root.style.setProperty('--card', card);

    renderSurfaces();
    renderSurfaceLevels();
}

// --- BORDER RADIUS ---
window.setBorderRadius = function (radius) {
    state.borderRadius = radius;
    document.body.setAttribute('data-border-radius', radius);
    renderBorderRadius();
}

function renderBorderRadius() {
    // Reset all buttons
    dom.btnRadiusNone.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
    dom.btnRadiusNone.classList.add('hover:bg-accent');
    dom.btnRadiusDefault.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
    dom.btnRadiusDefault.classList.add('hover:bg-accent');
    dom.btnRadiusRounded.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
    dom.btnRadiusRounded.classList.add('hover:bg-accent');
    dom.btnRadiusFull.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
    dom.btnRadiusFull.classList.add('hover:bg-accent');

    // Activate selected button
    if (state.borderRadius === 'none') {
        dom.btnRadiusNone.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnRadiusNone.classList.remove('hover:bg-accent');
    } else if (state.borderRadius === 'default') {
        dom.btnRadiusDefault.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnRadiusDefault.classList.remove('hover:bg-accent');
    } else if (state.borderRadius === 'rounded') {
        dom.btnRadiusRounded.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnRadiusRounded.classList.remove('hover:bg-accent');
    } else if (state.borderRadius === 'full') {
        dom.btnRadiusFull.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        dom.btnRadiusFull.classList.remove('hover:bg-accent');
    }
}

// --- BUTTON STYLE ---
window.setButtonStyle = function (style) {
    state.buttonStyle = style;
    document.body.setAttribute('data-button-style', style);
    renderButtonStyle();
}

function renderButtonStyle() {
    // Reset
    ['flat', 'gradient', 'bevel'].forEach(s => {
        const btn = document.getElementById(`btn-style-${s}`);
        if (btn) {
            btn.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
            btn.classList.add('hover:bg-accent');
        }
    });

    // Active
    // Active
    const activeBtn = document.getElementById(`btn-style-${state.buttonStyle}`);
    if (activeBtn) {
        activeBtn.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        activeBtn.classList.remove('hover:bg-accent');
    }
}

// --- SHADOWS ---
window.setShadows = function (style) {
    state.shadows = style;
    document.body.setAttribute('data-shadows', style);
    renderShadows();
}

function renderShadows() {
    // Reset
    ['none', 'default', 'large'].forEach(s => {
        const btn = document.getElementById(`btn-shadow-${s}`);
        if (btn) {
            btn.classList.remove('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
            btn.classList.add('hover:bg-accent');
        }
    });

    // Active
    // Active
    const activeBtn = document.getElementById(`btn-shadow-${state.shadows}`);
    if (activeBtn) {
        activeBtn.classList.add('border-[var(--color-600)]', 'text-[var(--color-600)]', 'border-2');
        activeBtn.classList.remove('hover:bg-accent');
    }
}

// --- FONT FAMILY ---
window.setFontFamily = function (font) {
    state.fontFamily = font;
    document.body.style.fontFamily = font;
    dom.fontFamilySelect.value = font;
}

// --- EVENT LISTENERS ---
dom.hue.addEventListener('input', (e) => { state.hue = parseFloat(e.target.value); state.baseColor = null; dom.hex.value = ''; updateUI(); dom.savedPresetsSelect.value = ""; dom.btnDeleteTrigger.classList.add('hidden'); });
dom.chroma.addEventListener('input', (e) => { state.chroma = parseFloat(e.target.value); state.baseColor = null; dom.hex.value = ''; updateUI(); dom.savedPresetsSelect.value = ""; dom.btnDeleteTrigger.classList.add('hidden'); });
dom.hex.addEventListener('input', handleHex);
dom.picker.addEventListener('input', (e) => { dom.hex.value = e.target.value; handleHex(e); });
dom.fontFamilySelect.addEventListener('change', (e) => {
    window.setFontFamily(e.target.value);
});

function handleHex(e) {
    const val = dom.hex.value;
    if (/^#?([0-9A-F]{3}){1,2}$/i.test(val)) {
        dom.preview.style.backgroundColor = val;
        const { h, c, l } = hexToOklch(val);
        state.hue = h; state.chroma = c;
        state.baseColor = { hex: val, l: l };
        dom.hue.value = h; dom.chroma.value = c;
        if (l > 0.99 || l < 0.05) dom.warning.classList.remove('hidden'); else dom.warning.classList.add('hidden');
        dom.savedPresetsSelect.value = ""; dom.btnDeleteTrigger.classList.add('hidden');
        updateUI();
    }
}

dom.savedPresetsSelect.addEventListener('change', (e) => {
    const name = e.target.value;
    if (name && userPresets[name]) {
        const p = userPresets[name];
        applyPreset(p.hue, p.chroma);
        dom.btnDeleteTrigger.classList.remove('hidden');
    } else { dom.btnDeleteTrigger.classList.add('hidden'); }
});

dom.btnDeleteTrigger.addEventListener('click', () => { if (dom.savedPresetsSelect.value) { dom.deleteTargetName.textContent = dom.savedPresetsSelect.value; dom.deleteDialog.showModal(); } });
dom.btnCancelDelete.addEventListener('click', () => dom.deleteDialog.close());
dom.btnConfirmDelete.addEventListener('click', confirmDeletePreset);
dom.btnSaveTrigger.addEventListener('click', () => { dom.saveNameInput.value = ''; dom.saveDialog.showModal(); });
dom.btnCancelSave.addEventListener('click', () => dom.saveDialog.close());
dom.btnCloseSaveDialog.addEventListener('click', () => dom.saveDialog.close());
dom.btnConfirmSave.addEventListener('click', saveScale);

dom.presets.innerHTML = PRESETS.map(p => `<button onclick="applyPreset(${p.h}, ${p.c})" class="flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs hover:bg-accent transition-colors"><div class="w-2.5 h-2.5 rounded-full" style="background-color: oklch(0.6 ${p.c} ${p.h})"></div>${p.name}</button>`).join('');

function applyPreset(h, c) {
    state.hue = h; state.chroma = c;
    state.baseColor = null;
    dom.hex.value = '';
    dom.warning.classList.add('hidden');
    updateUI();
}

document.getElementById('btn-theme').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    document.getElementById('icon-theme').setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
    updateSurface();
});
document.getElementById('btn-copy-json').addEventListener('click', () => copyToClipboard(JSON.stringify(currentScaleValues, null, 2), 'JSON Copied!'));
document.getElementById('btn-reset').addEventListener('click', () => { applyPreset(250, 0.14); applySurface('Zinc'); setSurfaceLevel('flat'); setBorderRadius('default'); setButtonStyle('flat'); setShadows('default'); dom.savedPresetsSelect.value = ""; dom.btnDeleteTrigger.classList.add('hidden'); });

dom.btnImport.addEventListener('click', () => dom.fileImport.click());
dom.fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            const sample = json['500'];
            const match = sample && sample.match(/oklch\(([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\)/);
            if (match) { applyPreset(parseFloat(match[3]), parseFloat(match[2])); showToast("Scale imported!"); } else throw new Error();
        } catch { showToast("Error: Invalid JSON", true); }
        dom.fileImport.value = '';
    };
    reader.readAsText(file);
});

initSavedPresets();
lucide.createIcons();
renderScale();
applySurface('Zinc');
setBorderRadius('default');
setButtonStyle('flat');
setShadows('default');
window.setFontFamily('Inter, sans-serif');
updateUI();

// --- CANDLESTICK CHART ---
function renderCandlestickChart() {
    const container = document.getElementById('candlestick-container');
    if (!container) return;

    // Mock OHLC Data
    const data = [
        { o: 150, h: 160, l: 145, c: 155 },
        { o: 155, h: 158, l: 150, c: 152 },
        { o: 152, h: 165, l: 150, c: 162 },
        { o: 162, h: 168, l: 158, c: 160 },
        { o: 160, h: 175, l: 155, c: 172 },
        { o: 172, h: 172, l: 165, c: 168 },
        { o: 168, h: 180, l: 166, c: 178 },
        { o: 178, h: 185, l: 175, c: 182 },
        { o: 182, h: 182, l: 170, c: 175 },
        { o: 175, h: 190, l: 172, c: 188 },
        { o: 188, h: 195, l: 185, c: 192 },
        { o: 192, h: 192, l: 180, c: 185 }
    ];

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = 20;

    // Scales
    const minPrice = Math.min(...data.map(d => d.l));
    const maxPrice = Math.max(...data.map(d => d.h));
    const priceRange = maxPrice - minPrice;

    const candleWidth = (w - (padding * 2)) / data.length * 0.6;
    const gap = (w - (padding * 2)) / data.length;

    let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" class="overflow-visible">`;

    // Grid Lines (Optional, purely aesthetic)
    svgContent += `<line x1="0" y1="${h / 4}" x2="${w}" y2="${h / 4}" stroke="currentColor" stroke-opacity="0.05" />`;
    svgContent += `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="currentColor" stroke-opacity="0.05" />`;
    svgContent += `<line x1="0" y1="${h * 0.75}" x2="${w}" y2="${h * 0.75}" stroke="currentColor" stroke-opacity="0.05" />`;

    data.forEach((d, i) => {
        const x = padding + (i * gap) + (gap - candleWidth) / 2;
        const yHigh = padding + ((maxPrice - d.h) / priceRange) * (h - padding * 2);
        const yLow = padding + ((maxPrice - d.l) / priceRange) * (h - padding * 2);
        const yOpen = padding + ((maxPrice - d.o) / priceRange) * (h - padding * 2);
        const yClose = padding + ((maxPrice - d.c) / priceRange) * (h - padding * 2);

        const isBullish = d.c > d.o;
        // Bullish: Green (Emerald 500), Bearish: Red (Rose 500)
        // Using Tailwind colors directly for SVG
        const color = isBullish ? '#10b981' : '#f43f5e';

        // Wick
        svgContent += `<line x1="${x + candleWidth / 2}" y1="${yHigh}" x2="${x + candleWidth / 2}" y2="${yLow}" stroke="${color}" stroke-width="1.5" />`;

        // Body
        // Rect height must be positive
        const bodyY = Math.min(yOpen, yClose);
        const bodyHeight = Math.abs(yClose - yOpen);

        svgContent += `<rect x="${x}" y="${bodyY}" width="${candleWidth}" height="${Math.max(bodyHeight, 1)}" fill="${color}" rx="1" class="candle" data-o="${d.o}" data-h="${d.h}" data-l="${d.l}" data-c="${d.c}" />`;
    });

    svgContent += `</svg>`;
    svgContent += '<div id="candlestick-tooltip" class="chart-tooltip"></div>';

    container.innerHTML = svgContent;

    // Tooltips
    const candles = container.querySelectorAll('.candle');
    const tooltip = document.getElementById('candlestick-tooltip');

    candles.forEach(candle => {
        candle.addEventListener('mouseenter', (e) => {
            const o = e.target.getAttribute('data-o');
            const h = e.target.getAttribute('data-h');
            const l = e.target.getAttribute('data-l');
            const c = e.target.getAttribute('data-c');
            const isBull = parseFloat(c) > parseFloat(o);

            tooltip.innerHTML = `
                <div class="font-bold border-b pb-1 mb-1 ${isBull ? 'text-emerald-600' : 'text-rose-600'}">${isBull ? 'Bullish' : 'Bearish'}</div>
                <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                    <span class="opacity-70">Open</span> <span class="font-mono text-right">${o}</span>
                    <span class="opacity-70">High</span> <span class="font-mono text-right">${h}</span>
                    <span class="opacity-70">Low</span> <span class="font-mono text-right">${l}</span>
                    <span class="opacity-70">Close</span> <span class="font-mono text-right">${c}</span>
                </div>
            `;
            tooltip.style.opacity = '1';

            const r = e.target.getBoundingClientRect();
            const cont = container.getBoundingClientRect();
            tooltip.style.left = `${(r.left - cont.left) + candleWidth + 5}px`;
            tooltip.style.top = `${(r.top - cont.top) - 20}px`;
        });

        candle.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}
window.addEventListener('resize', renderCandlestickChart);

// Initialize everything
setTimeout(() => {
    renderChart();
    renderCandlestickChart();
    initNavigation();
    initStockChart();
}, 100);

// --- NAVIGATION ---
function initNavigation() {
    const navScale = document.getElementById('nav-scale');
    const navExample = document.getElementById('nav-example');
    const viewScale = document.getElementById('view-scale');
    const viewExample = document.getElementById('view-example');

    function switchTab(view) {
        if (view === 'scale') {
            viewScale.classList.remove('hidden');
            viewExample.classList.add('hidden');
            navScale.classList.remove('text-muted-foreground', 'hover:bg-transparent');
            navScale.classList.add('bg-muted', 'text-foreground');
            navExample.classList.add('text-muted-foreground', 'hover:bg-transparent');
            navExample.classList.remove('bg-muted', 'text-foreground');
        } else {
            viewScale.classList.add('hidden');
            viewExample.classList.remove('hidden');
            navExample.classList.remove('text-muted-foreground', 'hover:bg-transparent');
            navExample.classList.add('bg-muted', 'text-foreground');
            navScale.classList.add('text-muted-foreground', 'hover:bg-transparent');
            navScale.classList.remove('bg-muted', 'text-foreground');

            // Resize chart when it becomes visible
            if (window.stockChart) {
                setTimeout(() => window.stockChart.reflow(), 10);
            }
        }
    }

    navScale.addEventListener('click', () => switchTab('scale'));
    navExample.addEventListener('click', () => switchTab('example'));
}

// --- HIGHCHARTS STOCK ---
// --- HIGHCHARTS STOCK & CUSTOM SVG CHART ---
function initStockChart() {
    lucide.createIcons();
    const btnSimple = document.getElementById('btn-mode-simple');
    const btnAdvanced = document.getElementById('btn-mode-advanced');
    window.chartMode = 'simple'; // Default

    // Generate random stock data (OHLC)
    // 1 year of daily data
    window.fullOhlcData = (function () {
        const arr = [];
        const now = new Date();
        const startTime = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
        let price = 150;
        // Generate roughly 365 points
        for (let i = 0; i < 365; i++) {
            const date = startTime + i * 24 * 60 * 60 * 1000;
            const open = price;
            const close = price + (Math.random() * 10 - 5);
            const high = Math.max(open, close) + Math.random() * 5;
            const low = Math.min(open, close) - Math.random() * 5;
            arr.push([date, open, high, low, close]);
            price = close;
        }
        return arr;
    })();

    // Initialize Highcharts (Hidden by default)
    Highcharts.stockChart('stock-chart-container', {
        chart: {
            backgroundColor: 'transparent',
            style: { fontFamily: 'inherit' }
        },
        rangeSelector: { selected: 1 },
        credits: { enabled: false },
        title: { text: '' },
        yAxis: [{
            labels: { align: 'left' },
            height: '80%',
            resize: { enabled: true }
        }, {
            labels: { align: 'left' },
            top: '80%',
            height: '20%',
            offset: 0
        }],
        series: [{
            type: 'candlestick',
            name: 'AAPL',
            data: window.fullOhlcData,
            color: '#f43f5e',
            lineColor: '#f43f5e',
            upColor: '#10b981',
            upLineColor: '#10b981'
        }],
        stockTools: { gui: { enabled: true } },
        navigation: { bindingsClassName: 'tools-container' }
    }, function (chart) {
        window.stockChart = chart;
        updateChartTheme();
    });

    // Initialize Simple Chart (SVG)
    initSimpleChart();

    // Toggle Logic
    const updateModeUI = () => {
        const activeClass = 'bg-background text-foreground shadow-sm'.split(' ');
        const inactiveClass = 'text-muted-foreground hover:text-foreground'.split(' ');
        const simpleWrapper = document.getElementById('simple-chart-wrapper');
        const advancedContainer = document.getElementById('stock-chart-container');

        if (window.chartMode === 'simple') {
            btnSimple.classList.add(...activeClass);
            btnSimple.classList.remove(...inactiveClass);
            btnAdvanced.classList.add(...inactiveClass);
            btnAdvanced.classList.remove(...activeClass);

            simpleWrapper.classList.remove('hidden');
            advancedContainer.classList.add('hidden');
            renderSimpleChart(); // Re-render to ensure size/theme
        } else {
            btnAdvanced.classList.add(...activeClass);
            btnAdvanced.classList.remove(...inactiveClass);
            btnSimple.classList.add(...inactiveClass);
            btnSimple.classList.remove(...activeClass);

            simpleWrapper.classList.add('hidden');
            advancedContainer.classList.remove('hidden');
            // Resize Highcharts
            if (window.stockChart) setTimeout(() => window.stockChart.reflow(), 10);
        }
    };

    btnSimple.addEventListener('click', () => {
        if (window.chartMode !== 'simple') {
            window.chartMode = 'simple';
            updateModeUI();
        }
    });

    btnAdvanced.addEventListener('click', () => {
        if (window.chartMode !== 'advanced') {
            window.chartMode = 'advanced';
            updateModeUI();
        }
    });
}

// --- SIMPLE SVG CHART LOGIC ---
let simpleChartRange = '1Y'; // Default

function initSimpleChart() {
    // Range Buttons
    const buttons = document.querySelectorAll('.simple-range-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI
            buttons.forEach(b => {
                b.classList.remove('bg-muted', 'text-foreground');
                b.classList.add('text-muted-foreground');
            });
            e.target.classList.remove('text-muted-foreground');
            e.target.classList.add('bg-muted', 'text-foreground');

            // Set Range
            simpleChartRange = e.target.getAttribute('data-range');
            renderSimpleChart();
        });
    });

    // Initial Render
    renderSimpleChart();
    window.addEventListener('resize', () => {
        if (window.chartMode === 'simple') renderSimpleChart();
    });
}

function filterDataForRange(range) {
    const data = window.fullOhlcData; // [Date, Open, High, Low, Close]
    if (!data || data.length === 0) return [];

    const end = data[data.length - 1][0];
    let start = data[0][0];
    const oneDay = 24 * 60 * 60 * 1000;

    switch (range) {
        case '1M': start = end - 30 * oneDay; break;
        case '3M': start = end - 90 * oneDay; break;
        case '6M': start = end - 180 * oneDay; break;
        case 'YTD':
            const now = new Date(end);
            start = new Date(now.getFullYear(), 0, 1).getTime();
            break;
        case '1Y': start = end - 365 * oneDay; break;
        case 'ALL': default: start = data[0][0]; break;
    }

    return data.filter(d => d[0] >= start).map(d => ({ date: d[0], value: d[4] }));
}

function renderSimpleChart() {
    const container = document.getElementById('simple-chart-container');
    if (!container) return;

    const data = filterDataForRange(simpleChartRange);
    if (data.length < 2) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = 10; // Top/Bottom padding

    // Find Min/Max
    let minVal = Infinity, maxVal = -Infinity;
    data.forEach(d => {
        if (d.value < minVal) minVal = d.value;
        if (d.value > maxVal) maxVal = d.value;
    });
    const rangeVal = maxVal - minVal;

    // Map Points
    const pts = data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        // Normalize y to height with padding
        const normalizedY = (d.value - minVal) / rangeVal;
        // Invert Y for SVG (0 is top)
        const y = (h - padding) - (normalizedY * (h - 2 * padding));
        return { x, y, ...d };
    });

    // Generate Path (Basic Spline or Linear)
    // Using Catmull-Rom for smoothing (simplified) or simple Line
    // For Shadcn look, a simple line with slight curve is good.
    // Let's implement a simple line first, then curve. Recharts "monotone" is standard.
    // Doing strict linear for robustness first.

    // Construct Path 'd'
    // L commands
    /*
    let dPath = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        dPath += ` L ${pts[i].x},${pts[i].y}`;
    }
    */

    // Cubic Bezier Smoothing (Simple Logic)
    // Or just Polyline for performance? Shadcn uses curves.
    // Let's manually smooth slightly.
    // A robust way without heavy math is to just use L for now to ensure it works, 
    // or use a helper for spline.

    // Using a simple strategy:
    // Move to first, then for each subsequent, curve to it.
    // Implementing a basic standard line for "Area"
    let dPath = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        // Midpoint control smoothing
        // const mx = (p0.x + p1.x) / 2;
        // dPath += ` C ${mx},${p0.y} ${mx},${p1.y} ${p1.x},${p1.y}`;
        // Simple Line for Reliability
        dPath += ` L ${p1.x},${p1.y}`;
    }

    // Area Fill Path: Close the loop down to bottom corners
    const dFill = `${dPath} L ${w},${h} L 0,${h} Z`;

    // Colors
    const color600 = getComputedStyle(root).getPropertyValue('--color-600').trim();

    // SVG
    const svg = `
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="overflow: visible;">
        <defs>
            <linearGradient id="simpleChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="${color600}" stop-opacity="0.3"></stop>
                <stop offset="95%" stop-color="${color600}" stop-opacity="0"></stop>
            </linearGradient>
        </defs>
        <path d="${dFill}" fill="url(#simpleChartGradient)" />
        <path d="${dPath}" fill="none" stroke="${color600}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Crosshair Line (Hidden by default) -->
        <line id="crosshair-x" x1="0" y1="0" x2="0" y2="${h}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4 4" style="opacity: 0;" />
        
        <!-- Hover Area Overlay -->
        <rect id="chart-overlay" width="${w}" height="${h}" fill="transparent" />
    </svg>
    `;

    container.innerHTML = svg;

    // Interactivity
    const overlay = container.querySelector('#chart-overlay');
    const crosshair = container.querySelector('#crosshair-x');
    const tooltip = document.getElementById('simple-chart-tooltip');

    overlay.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        // Find nearest point
        // Index roughly:
        const index = Math.min(Math.max(Math.round((mouseX / w) * (pts.length - 1)), 0), pts.length - 1);
        const pt = pts[index];

        // Move Crosshair
        crosshair.setAttribute('x1', pt.x);
        crosshair.setAttribute('x2', pt.x);
        crosshair.style.opacity = '1';

        // Update Tooltip
        tooltip.classList.remove('hidden');
        tooltip.style.left = `${pt.x + 10}px`; // Offset slightly
        tooltip.style.top = `${Math.min(pt.y, h - 50)}px`; // Keep somewhat near data, adjust if clips

        // Handle tooltip overflow container right edge
        if (pt.x > w - 120) {
            tooltip.style.left = `${pt.x - 110}px`;
        }

        const dateStr = new Date(pt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        document.getElementById('simple-tooltip-price').innerText = pt.value.toFixed(2) + ' USD';
        document.getElementById('simple-tooltip-date').innerText = dateStr;
    });

    overlay.addEventListener('mouseleave', () => {
        crosshair.style.opacity = '0';
        tooltip.classList.add('hidden');
    });
}

function updateChartTheme() {
    // Re-render SVG if in simple mode
    if (window.chartMode === 'simple') {
        renderSimpleChart();
    }

    // Existing Highcharts theme update logic
    if (!window.stockChart) return;
    const isDark = root.classList.contains('dark');
    const color600 = getComputedStyle(root).getPropertyValue('--color-600').trim();
    const fg = isDark ? '#ffffff' : '#000000';
    const muted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const grid = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    window.stockChart.update({
        chart: {
            backgroundColor: 'transparent',
            style: { fontFamily: state.fontFamily }
        },
        xAxis: {
            gridLineColor: grid,
            lineColor: muted,
            tickColor: muted,
            labels: { style: { color: muted } }
        },
        yAxis: [{
            gridLineColor: grid,
            labels: { style: { color: muted } }
        }, {
            gridLineColor: grid,
            labels: { style: { color: muted } }
        }],
        rangeSelector: {
            buttonTheme: {
                fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                style: { color: fg },
                states: {
                    select: {
                        fill: color600,
                        style: { color: '#ffffff' }
                    },
                    hover: {
                        fill: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }
                }
            },
            labelStyle: { color: muted }
        },
        navigator: {
            maskFill: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            series: { color: color600, lineColor: color600 },
            xAxis: { labels: { style: { color: muted } } }
        },
        series: [{
            color: isSimple ? color600 : '#f43f5e',
            lineColor: isSimple ? color600 : '#f43f5e',
            fillColor: isSimple ? gradient : undefined,
            upColor: '#10b981',
            upLineColor: '#10b981'
        }]
    });
}
