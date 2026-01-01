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
let state = { hue: 250, chroma: 0.14, baseColor: null, surfaceLevel: 'flat', borderRadius: 'default', buttonStyle: 'flat', shadows: 'default', fontFamily: 'Inter, sans-serif', positivePreset: 'Emerald', negativePreset: 'Red', warningPreset: 'Amber', dangerPreset: 'Red' };
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

/**
 * Shared logic for chroma adjustment based on lightness
 */
function getAdjustedChroma(l, baseChroma) {
    let adjChroma = baseChroma;
    if (l > 0.92) adjChroma = baseChroma * 0.5;
    if (l < 0.2) adjChroma = baseChroma * 0.8;
    return adjChroma;
}

/**
 * Shared contrast logic to determine if white or black text should be used
 * and returns the resulting ratio.
 */
function getContrastOutcome(l, c, h) {
    const adjChroma = getAdjustedChroma(l, c);
    const rgb = oklchToSrgb(l, adjChroma, h);
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const contrastWhite = getContrast(rgb, white);
    const contrastBlack = getContrast(rgb, black);

    if (contrastWhite >= 4.5) {
        return { useWhite: true, ratio: contrastWhite };
    } else if (contrastBlack >= 4.5) {
        return { useWhite: false, ratio: contrastBlack };
    } else {
        // Fallback to highest available if AA can't be met
        return contrastWhite > contrastBlack
            ? { useWhite: true, ratio: contrastWhite }
            : { useWhite: false, ratio: contrastBlack };
    }
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
    // Semantic
    positiveSelect: document.getElementById('positive-preset-select'),
    negativeSelect: document.getElementById('negative-preset-select'),
    warningSelect: document.getElementById('warning-preset-select'),
    dangerSelect: document.getElementById('danger-preset-select'),
    // Contrast Checker
    btnContrast: document.getElementById('btn-contrast'),
    mobBtnContrast: document.getElementById('mob-btn-contrast'),
    btnCloseContrast: document.getElementById('btn-close-contrast'),
    contrastDialog: document.getElementById('contrast-dialog'),
    contrastBadge: document.getElementById('contrast-badge'),
    gridContent: document.getElementById('contrast-grid-content'),
    gridInteractive: document.getElementById('contrast-grid-interactive'),
};

// --- CONTRAST CHECKER ---
// WCAG 2.2 AA requires 4.5:1 for normal text, 3:1 for large text/ui components
const CONTRAST_PAIRS = {
    content: [
        { name: 'Base', bgVar: '--background', fgVar: '--foreground', label: 'Sample Text' },
        { name: 'Card', bgVar: '--card', fgVar: '--card-foreground', label: 'Sample Text' },
        { name: 'Popover', bgVar: '--popover', fgVar: '--popover-foreground', label: 'Sample Text' },
        { name: 'Muted', bgVar: '--muted', fgVar: '--muted-foreground', label: 'Sample Text' }
    ],
    interactive: [
        { name: 'Primary', bgVar: '--primary', fgVar: '--primary-foreground', label: 'Button Text' },
        { name: 'Secondary', bgVar: '--secondary', fgVar: '--secondary-foreground', label: 'Button Text' },
        { name: 'Accent', bgVar: '--accent', fgVar: '--accent-foreground', label: 'Accent Text' },
        { name: 'Destructive', bgVar: '--destructive', fgVar: '--destructive-foreground', label: 'Error Text' }
    ]
};

function getComputedColor(varName) {
    // Get the value from the root style (which might be oklch(...))
    // We need to resolve this to RGB for our contrast calculator
    const val = getComputedStyle(root).getPropertyValue(varName).trim();
    // FALLBACK: If checking primary and it is resolving to a variable ref that isn't computed yet or similar edge case, 
    // manually resolve for known dynamic vars to ensure checker is instant
    if (varName === '--primary') {
        // Re-calculate 600 manually to be safe? 
        // Actually, if we just set it in updateUI, it should be available. 
        // But let's check for the "var(--color-600)" string return.
        if (val.startsWith('var(')) {
            const innerVar = val.match(/var\(([\w-]+)\)/)[1];
            return getComputedColor(innerVar);
        }
    }
    if (!val) return { r: 255, g: 255, b: 255 }; // Fallback

    // If it's oklch, parse it
    // Format: oklch(l c h) or oklch(l c h / alpha)
    const oklchMatch = val.match(/oklch\(([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)(?:\s*\/\s*[\d\.]+)?\)/);
    if (oklchMatch) {
        return oklchToSrgb(parseFloat(oklchMatch[1]), parseFloat(oklchMatch[2]), parseFloat(oklchMatch[3]));
    }

    // If it's HSL (existing surfaces uses HSL format: "H S% L%")
    // HSL logic for Surfaces is a bit unique in this codebase, stored as raw numbers "0 0% 100%"
    // But getComputedStyle might return it differently or if it's assigned to a var that expects color function wrapper
    // The codebase surfaces sets --background to "H S L". so we need to wrap it if we use it directly, 
    // BUT wait, --background is used in `background-color: hsl(var(--background))` usually.
    // Let's check how it is used. `root.style.setProperty('--background', bg);` where bg is "0 0% 100%"
    // So the variable itself is just the channels.

    // However, our oklch logic sets full strings "oklch(...)".

    // Let's assume for checking, we might need to try parsing "H S L"
    const spaces = val.split(' ');
    if (spaces.length >= 3 && !val.includes('oklch')) {
        // Assume HSL channels
        // We'll need a quick HSL to RGB helper or use a canvas/browser trick. 
        // Since we are in browser, we can use a temporary element.
        return resolveColorToRgb(`hsl(${val})`);
    }

    return resolveColorToRgb(val);
}

function resolveColorToRgb(colorStr) {
    // Determine if it is a variable that needs wrapping
    // If the string is just space separated numbers, it might be the tailwind var pattern
    if (!colorStr.startsWith('#') && !colorStr.startsWith('rgb') && !colorStr.startsWith('hsl') && !colorStr.startsWith('oklch')) {
        // It's likely the "H S L" or "L C H" string content from the variable
        // Try wrapping in hsl() first as that is the legacy part
        const temp = document.createElement('div');
        temp.style.color = `hsl(${colorStr})`;
        document.body.appendChild(temp);
        const style = getComputedStyle(temp);
        const rgb = style.color; // Returns rgb(r, g, b)
        document.body.removeChild(temp);

        if (rgb && rgb !== '') return parseRgbString(rgb);
    }

    const temp = document.createElement('div');
    temp.style.color = colorStr;
    document.body.appendChild(temp);
    const style = getComputedStyle(temp);
    const rgb = style.color;
    document.body.removeChild(temp);
    return parseRgbString(rgb);
}

function parseRgbString(str) {
    const match = str.match(/\d+/g);
    if (!match || match.length < 3) return { r: 255, g: 255, b: 255 };
    return { r: Number(match[0]), g: Number(match[1]), b: Number(match[2]) };
}

function checkAllContrasts() {
    let failures = 0;
    const results = { content: [], interactive: [] };

    // Helper process function
    const processPair = (pair) => {
        const bgRgb = getComputedColor(pair.bgVar);
        const fgRgb = getComputedColor(pair.fgVar);

        // We also need the raw strings for the visual preview in the modal
        const bgStr = getComputedStyle(root).getPropertyValue(pair.bgVar).trim();
        const fgStr = getComputedStyle(root).getPropertyValue(pair.fgVar).trim();

        // Handle the "raw channels" case for CSS variables for display purposes
        // if bgStr has no '(', wrap it based on heuristic? 
        // Actually, for the "style" attribute in the modal, we can just use `var(${pair.bgVar})` 
        // providing the CSS handles the variable usage correctly.
        // BUT, if the variable is just "0 0% 100%", `background: var(--background)` fails in standard CSS unless inside `hsl()`.
        // The codebase uses `hsl(var(--background))` in Tailwind config presumably.
        // To be safe for the "style" tag, we should resolve the full computed value.
        const bgStyle = `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`;
        const fgStyle = `rgb(${fgRgb.r}, ${fgRgb.g}, ${fgRgb.b})`;

        const ratio = getContrast(bgRgb, fgRgb);
        const passed = ratio >= 4.5;
        if (!passed) failures++;

        return { ...pair, ratio, passed, bgStyle, fgStyle };
    };

    CONTRAST_PAIRS.content.forEach(p => results.content.push(processPair(p)));
    CONTRAST_PAIRS.interactive.forEach(p => results.interactive.push(processPair(p)));

    updateContrastBadge(failures);
    renderContrastModalContent(results);
}

function updateContrastBadge(count) {
    if (!dom.contrastBadge) return;
    dom.contrastBadge.innerText = count;
    if (count > 0) {
        dom.contrastBadge.classList.remove('hidden');
        dom.btnContrast.classList.add('text-destructive');
    } else {
        dom.contrastBadge.classList.add('hidden');
        dom.btnContrast.classList.remove('text-destructive');
    }
}

function renderContrastModalContent(results) {
    const createCard = (item) => `
        <div class="rounded-lg border p-4 flex items-center justify-between gap-4 relative overflow-hidden group">
            <div class="space-y-1 z-10">
                <div class="font-semibold text-sm flex items-center gap-2">
                    ${item.name}
                    ${!item.passed ? '<i data-lucide="alert-triangle" class="w-3 h-3 text-red-500"></i>' : ''}
                </div>
                <div class="text-xs text-muted-foreground font-mono">
                   ${item.passed ? 'Pass' : 'Fail'}
                </div>
            </div>

            <div class="flex items-center gap-6 z-10">
                 <!-- Preview Block -->
                <div class="w-32 h-16 rounded-md shadow-sm border flex items-center justify-center relative overflow-hidden" 
                     style="background-color: ${item.bgStyle}; color: ${item.fgStyle}">
                     <span class="text-lg font-bold">Aa</span>
                </div>
                
                <div class="text-right min-w-[60px]">
                    <div class="text-2xl font-bold font-mono ${item.passed ? 'text-emerald-600' : 'text-red-600'}">
                        ${item.ratio.toFixed(2)}
                    </div>
                    <div class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Ratio</div>
                </div>
            </div>
            
            ${!item.passed ? '<div class="absolute inset-0 bg-red-50 dark:bg-red-900/10 opacity-50 z-0 pointer-events-none"></div>' : ''}
        </div>
    `;

    if (dom.gridContent) dom.gridContent.innerHTML = results.content.map(createCard).join('');
    if (dom.gridInteractive) dom.gridInteractive.innerHTML = results.interactive.map(createCard).join('');
    lucide.createIcons();
}

// Ensure contrasting colors are checked whenever UI updates
// We hook into the existing updateUI function by appending logic at the end of it
// But since we can't easily modify the function body of updateUI without replacing it fully,
// we will rely on the custom event 'colorChange' which is dispatched at the end of updateUI!
window.addEventListener('colorChange', () => {
    // Use timeout to let DOM styles settle if necessary
    setTimeout(checkAllContrasts, 50);
});
// Also listen for surface changes which might not trigger colorChange depending on implementation
// The logic for Surface changes calls `updateSurface()` then `renderSurfaces()`. 
// We should check if we can modify `updateSurface` or just poll. 
// Actually, `applySurface` and `setSurfaceLevel` are global. We can wrap them?
// Or just add a MutationObserver on the root style attribute?
// Let's add an invocation in the toggleTheme and resetConfiguration as well.

const observer = new MutationObserver(() => {
    checkAllContrasts();
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });


if (dom.btnContrast) {
    dom.btnContrast.addEventListener('click', () => {
        checkAllContrasts(); // Run fresh check
        dom.contrastDialog.showModal();
    });
}
if (dom.mobBtnContrast) {
    dom.mobBtnContrast.addEventListener('click', () => {
        checkAllContrasts();
        dom.contrastDialog.showModal();
    });
}
if (dom.btnCloseContrast) {
    dom.btnCloseContrast.addEventListener('click', () => {
        dom.contrastDialog.close();
    });
}

// Initial Check
setTimeout(checkAllContrasts, 500);

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
        const adjChroma = getAdjustedChroma(stop.l, state.chroma);
        const val = `oklch(${stop.l} ${adjChroma.toFixed(3)} ${state.hue})`;
        root.style.setProperty(`--color-${stop.name}`, val);
        currentScaleValues[stop.name] = val;
    });

    // Semantic Colors
    const posP = PRESETS.find(p => p.name === state.positivePreset) || PRESETS.find(p => p.name === 'Emerald');
    const negP = PRESETS.find(p => p.name === state.negativePreset) || PRESETS.find(p => p.name === 'Red');
    const warnP = PRESETS.find(p => p.name === state.warningPreset) || PRESETS.find(p => p.name === 'Amber');
    const dangP = PRESETS.find(p => p.name === state.dangerPreset) || PRESETS.find(p => p.name === 'Red');

    const generateSemanticVars = (preset, prefix) => {
        STOPS.forEach(stop => {
            const adjChroma = getAdjustedChroma(stop.l, preset.c);
            const val = `oklch(${stop.l} ${adjChroma.toFixed(3)} ${preset.h})`;
            root.style.setProperty(`--color-${prefix}-${stop.name}`, val);
        });
    };

    generateSemanticVars(posP, 'positive');
    generateSemanticVars(negP, 'negative');
    generateSemanticVars(warnP, 'warning');
    generateSemanticVars(dangP, 'danger');

    // Update Dropdown Values
    if (dom.positiveSelect.value !== state.positivePreset) dom.positiveSelect.value = state.positivePreset;
    if (dom.negativeSelect.value !== state.negativePreset) dom.negativeSelect.value = state.negativePreset;
    if (dom.warningSelect.value !== state.warningPreset) dom.warningSelect.value = state.warningPreset;
    if (dom.dangerSelect.value !== state.dangerPreset) dom.dangerSelect.value = state.dangerPreset;

    dom.hueVal.innerText = state.hue.toFixed(0);
    dom.chromaVal.innerText = state.chroma.toFixed(3);
    dom.hue.value = state.hue;
    dom.chroma.value = state.chroma;
    dom.chroma.style.background = `linear-gradient(to right, #e2e8f0, oklch(0.6 0.3 ${state.hue}))`;

    if (!dom.hex.value) dom.preview.style.backgroundColor = `oklch(0.64 ${state.chroma} ${state.hue})`;

    renderScale();
    renderChart();
    updateChartTheme();
    renderCandlestickChart();
    updateSemanticClasses();
    renderCandlestickChart();
    updateSemanticClasses();

    // Map Primary to Brand (Color 600)
    // We calculate contrast against 600 using the shared outcome logic
    const brandStop = STOPS.find(s => s.name === '600');
    const outcome = getContrastOutcome(brandStop.l, state.chroma, state.hue);
    const fgVal = outcome.useWhite ? '0, 0%, 100%' : '0, 0%, 0%';

    root.style.setProperty('--primary', 'var(--color-600)');
    root.style.setProperty('--primary-foreground', fgVal);

    window.dispatchEvent(new CustomEvent('colorChange', { detail: { hue: state.hue, chroma: state.chroma } }));
}

function updateSemanticClasses() {
    // Helper to inject/update styles for semantic utility classes
    let style = document.getElementById('semantic-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'semantic-styles';
        document.head.appendChild(style);
    }

    // We use the variables we just set
    style.innerHTML = `
        .text-positive { color: var(--color-positive-600) !important; }
        .text-negative { color: var(--color-negative-600) !important; }
        .text-warning { color: var(--color-warning-600) !important; }
        .text-danger { color: var(--color-danger-600) !important; }
        .bg-positive-muted { background-color: var(--color-positive-500); opacity: 0.1; }
        .bg-positive-subtle { background-color: color-mix(in srgb, var(--color-positive-500) 10%, transparent); }
        .bg-negative-muted { background-color: var(--color-negative-500); opacity: 0.1; }
        .bg-negative-subtle { background-color: color-mix(in srgb, var(--color-negative-500) 10%, transparent); }
        .bg-warning-muted { background-color: var(--color-warning-500); opacity: 0.1; }
        .bg-warning-subtle { background-color: color-mix(in srgb, var(--color-warning-500) 10%, transparent); }
        .bg-danger-muted { background-color: var(--color-danger-500); opacity: 0.1; }
        .bg-danger-subtle { background-color: color-mix(in srgb, var(--color-danger-500) 10%, transparent); }
    `;

    // Attempt dynamic replacement of hardcoded classes if any exist in stock example
    // This is "best effort" to make existing Example Page text dynamic
    document.querySelectorAll('.text-emerald-600, .text-emerald-400').forEach(el => {
        el.classList.remove('text-emerald-600', 'text-emerald-400');
        el.classList.add('text-positive');
    });

    document.querySelectorAll('.bg-emerald-500\\/10').forEach(el => {
        el.classList.remove('bg-emerald-500/10');
        el.classList.add('bg-positive-subtle'); // Custom class
    });

    // Warning replacements
    document.querySelectorAll('.text-amber-600, .text-amber-500').forEach(el => {
        el.classList.remove('text-amber-600', 'text-amber-500');
        el.classList.add('text-warning');
    });
    document.querySelectorAll('.bg-amber-500\\/10').forEach(el => {
        el.classList.remove('bg-amber-500/10');
        el.classList.add('bg-warning-subtle');
    });

    // Danger replacements
    document.querySelectorAll('.text-red-600, .text-red-500, .text-destructive').forEach(el => {
        el.classList.remove('text-red-600', 'text-red-500', 'text-destructive', 'dark:text-red-400');
        el.classList.add('text-danger');
    });
    document.querySelectorAll('.bg-destructive\\/10, .bg-red-500\\/10').forEach(el => {
        el.classList.remove('bg-destructive/10', 'bg-red-500/10');
        el.classList.add('bg-danger-subtle');
    });
}

function renderScale() {
    let nearestStop = null;
    if (state.baseColor) {
        nearestStop = STOPS.reduce((prev, curr) => Math.abs(curr.l - state.baseColor.l) < Math.abs(prev.l - state.baseColor.l) ? curr : prev);
    }

    dom.scale.innerHTML = STOPS.map(stop => {
        const isNearest = nearestStop && stop.name === nearestStop.name;

        // Calculate Contrast using shared logic
        const outcome = getContrastOutcome(stop.l, state.chroma, state.hue);
        const useWhite = outcome.useWhite;
        const ratio = outcome.ratio;

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

function initSemanticSelects() {
    const populate = (sel) => {
        sel.innerHTML = '';
        PRESETS.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.innerText = p.name;
            sel.appendChild(opt);
        });
    };
    populate(dom.positiveSelect);
    populate(dom.negativeSelect);
    populate(dom.warningSelect);
    populate(dom.dangerSelect);

    // Force initial values
    dom.positiveSelect.value = state.positivePreset;
    dom.negativeSelect.value = state.negativePreset;
    dom.warningSelect.value = state.warningPreset;
    dom.dangerSelect.value = state.dangerPreset;

    dom.positiveSelect.addEventListener('change', (e) => {
        state.positivePreset = e.target.value;
        updateUI();
    });
    dom.negativeSelect.addEventListener('change', (e) => {
        state.negativePreset = e.target.value;
        updateUI();
    });
    dom.warningSelect.addEventListener('change', (e) => {
        state.warningPreset = e.target.value;
        updateUI();
    });
    dom.dangerSelect.addEventListener('change', (e) => {
        state.dangerPreset = e.target.value;
        updateUI();
    });
}

// --- GLOBAL ACTIONS ---
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    const iconName = isDark ? 'sun' : 'moon';

    const iconTheme = document.getElementById('icon-theme');
    if (iconTheme) iconTheme.setAttribute('data-lucide', iconName);

    const mobIconTheme = document.getElementById('mob-icon-theme');
    if (mobIconTheme) mobIconTheme.setAttribute('data-lucide', iconName);

    lucide.createIcons();
    updateSurface();
    updateChartTheme();

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
}

function resetConfiguration() {
    applyPreset(250, 0.14);
    applySurface('Zinc');
    setSurfaceLevel('flat');
    setBorderRadius('default');
    setButtonStyle('flat');
    setShadows('default');
    dom.savedPresetsSelect.value = "";
    dom.btnDeleteTrigger.classList.add('hidden');

    state.positivePreset = 'Emerald';
    state.negativePreset = 'Red';
    state.warningPreset = 'Amber';
    state.dangerPreset = 'Red';
    updateUI();

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
}

// Event Listeners
const btnTheme = document.getElementById('btn-theme');
if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

const mobBtnTheme = document.getElementById('mob-btn-theme');
if (mobBtnTheme) mobBtnTheme.addEventListener('click', toggleTheme);

const btnReset = document.getElementById('btn-reset');
if (btnReset) btnReset.addEventListener('click', resetConfiguration);

const mobBtnReset = document.getElementById('mob-btn-reset');
if (mobBtnReset) mobBtnReset.addEventListener('click', resetConfiguration);

const btnMobileMenu = document.getElementById('btn-mobile-menu-toggle');
if (btnMobileMenu) {
    btnMobileMenu.addEventListener('click', () => {
        const mm = document.getElementById('mobile-menu');
        if (mm) mm.classList.toggle('hidden');
    });
}

document.getElementById('btn-copy-json').addEventListener('click', () => copyToClipboard(JSON.stringify(currentScaleValues, null, 2), 'JSON Copied!'));

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

initSemanticSelects();
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
        // Bullish: Positive, Bearish: Negative
        const color = isBullish ? 'var(--color-positive-500)' : 'var(--color-negative-500)';

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
                <div class="font-bold border-b pb-1 mb-1 ${isBull ? 'text-positive' : 'text-negative'}">${isBull ? 'Bullish' : 'Bearish'}</div>
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
    const mobNavScale = document.getElementById('mob-nav-scale');
    const mobNavExample = document.getElementById('mob-nav-example');
    const mobNavConfig = document.getElementById('mob-nav-config');
    const viewScale = document.getElementById('view-scale');
    const viewExample = document.getElementById('view-example');
    const appAside = document.getElementById('app-aside');
    const mobileMenu = document.getElementById('mobile-menu');

    // State to track current view
    let currentView = 'scale';

    function updateNavState(el, isActive) {
        if (!el) return;
        if (isActive) {
            el.classList.remove('text-muted-foreground', 'hover:bg-transparent');
            el.classList.add('bg-muted', 'text-foreground');
        } else {
            el.classList.add('text-muted-foreground', 'hover:bg-transparent');
            el.classList.remove('bg-muted', 'text-foreground');
        }
    }

    function switchTab(view) {
        currentView = view;
        const isScale = view === 'scale';
        const isConfig = view === 'config';
        const isExample = view === 'example';

        // Visibility Logic
        if (isConfig) {
            // Configuration Mode (Mobile Only)
            if (appAside) appAside.classList.remove('hidden');
            if (viewScale) viewScale.classList.add('hidden');
            if (viewExample) viewExample.classList.add('hidden');
        } else if (isScale) {
            // Scale Mode
            if (appAside) appAside.classList.add('hidden'); // Hide aside on mobile
            if (viewScale) viewScale.classList.remove('hidden');
            if (viewExample) viewExample.classList.add('hidden');
        } else if (isExample) {
            // Example Mode
            if (appAside) appAside.classList.add('hidden'); // Hide aside on mobile
            if (viewScale) viewScale.classList.add('hidden');
            if (viewExample) viewExample.classList.remove('hidden');

            // Critical Fix: Remove any inline styles that might hide content
            viewExample.style.removeProperty('height');
            viewExample.style.removeProperty('overflow');
            viewExample.style.removeProperty('display');

            // Resize chart when it becomes visible
            if (window.stockChart) {
                setTimeout(() => window.stockChart.reflow(), 10);
            }
        }

        // Update Desktop Nav (No config button on desktop)
        updateNavState(navScale, isScale); // If config, neither is active visually, or maybe keep Scale active?
        updateNavState(navExample, isExample);

        // If config is selected on mobile, desktop nav might look empty. 
        // But users can't select config on desktop.
        // If they resize, we handle it below.

        // Update Mobile Nav
        updateNavState(mobNavScale, isScale);
        updateNavState(mobNavExample, isExample);
        updateNavState(mobNavConfig, isConfig);

        // Close mobile menu if open
        if (mobileMenu) mobileMenu.classList.add('hidden');
    }

    if (navScale) navScale.addEventListener('click', () => switchTab('scale'));
    if (navExample) navExample.addEventListener('click', () => switchTab('example'));
    if (mobNavScale) mobNavScale.addEventListener('click', () => switchTab('scale'));
    if (mobNavExample) mobNavExample.addEventListener('click', () => switchTab('example'));
    if (mobNavConfig) mobNavConfig.addEventListener('click', () => switchTab('config'));

    // Desktop/Mobile Reconcilliation
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && currentView === 'config') {
            switchTab('scale'); // Reset to scale view on desktop
        }
    });
}

// --- HIGHCHARTS STOCK ---
function initStockChart() {
    lucide.createIcons();

    // Generate random stock data (OHLC)
    const ohlcData = (function () {
        const arr = [];
        const startTime = Date.now() - 365 * 24 * 60 * 60 * 1000;
        let price = 150;
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

    // Mobile detection
    const isMobile = window.innerWidth < 768;

    Highcharts.stockChart('stock-chart-container', {
        chart: {
            backgroundColor: 'transparent',
            style: { fontFamily: 'inherit' }
        },
        rangeSelector: {
            enabled: !isMobile,
            selected: 1
        },
        navigator: {
            enabled: !isMobile
        },
        scrollbar: {
            enabled: !isMobile
        },
        credits: { enabled: false },
        title: { text: '' },
        yAxis: [{
            labels: { align: 'left' },
            height: '100%'
        }],
        series: [{
            type: 'candlestick',
            name: 'AAPL',
            data: ohlcData,
            color: '#f43f5e',
            lineColor: '#f43f5e',
            upColor: '#10b981',
            upLineColor: '#10b981'
        }],
        stockTools: { gui: { enabled: !isMobile } },
        navigation: { bindingsClassName: 'tools-container' }
    }, function (chart) {
        window.stockChart = chart;
        updateChartTheme();
    });

    // Handle Resize for breakpoint switching
    let wasMobile = isMobile;
    window.addEventListener('resize', () => {
        const currentMobile = window.innerWidth < 768;
        if (currentMobile !== wasMobile) {
            wasMobile = currentMobile;
            if (window.stockChart) {
                window.stockChart.update({
                    rangeSelector: { enabled: !currentMobile },
                    navigator: { enabled: !currentMobile },
                    scrollbar: { enabled: !currentMobile },
                    stockTools: { gui: { enabled: !currentMobile } }
                });
            }
        }
    });
}

function updateChartTheme() {
    if (!window.stockChart) return;
    const isDark = root.classList.contains('dark');

    // Get computed styles for semantic variables
    const computedStyle = getComputedStyle(root);
    const fgColor = `hsl(${computedStyle.getPropertyValue('--foreground').trim()})`;
    const mutedFgColor = `hsl(${computedStyle.getPropertyValue('--muted-foreground').trim()})`;
    const borderColor = `hsl(${computedStyle.getPropertyValue('--border').trim()})`;

    // color600 is used for some highlights
    const color600 = computedStyle.getPropertyValue('--color-600').trim();

    // Keep grid subtle
    const grid = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Calculate hex from the semantic variables effectively
    // Highcharts needs hex. We can compute it from the state presets.
    const posPreset = PRESETS.find(p => p.name === state.positivePreset) || PRESETS.find(p => p.name === 'Emerald');
    const negPreset = PRESETS.find(p => p.name === state.negativePreset) || PRESETS.find(p => p.name === 'Red');

    // Re-calc helper
    const getHexForStop = (preset, stopName) => {
        const stop = STOPS.find(s => s.name === stopName);
        let adjChroma = preset.c;
        if (stop.l > 0.92) adjChroma = preset.c * 0.5;
        if (stop.l < 0.2) adjChroma = preset.c * 0.8;
        const rgb = oklchToSrgb(stop.l, adjChroma, preset.h);
        return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
    };

    const upColorHex = getHexForStop(posPreset, '500'); // Emerald 500 usually
    const upLineHex = getHexForStop(posPreset, '600');
    const downColorHex = getHexForStop(negPreset, '500'); // Red 500 usually
    const downLineHex = getHexForStop(negPreset, '600');

    window.stockChart.update({
        chart: {
            backgroundColor: 'transparent',
            style: { fontFamily: state.fontFamily }
        },
        xAxis: {
            gridLineColor: grid,
            lineColor: borderColor,      // Fix: Use semantic border color
            tickColor: borderColor,      // Fix: Use semantic border color
            labels: { style: { color: mutedFgColor } } // Fix: Use semantic muted foreground
        },
        yAxis: [{
            gridLineColor: grid,
            labels: { style: { color: mutedFgColor } } // Fix: Use semantic muted foreground
        }],
        rangeSelector: {
            buttonTheme: {
                fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                style: { color: fgColor },
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
            labelStyle: { color: mutedFgColor }
        },
        navigator: {
            maskFill: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            series: { color: color600, lineColor: color600 },
            xAxis: { labels: { style: { color: mutedFgColor } } }
        },
        series: [{
            color: downColorHex,
            lineColor: downLineHex,
            upColor: upColorHex,
            upLineColor: upLineHex
        }]
    });

    // Force update of existing range selector buttons (Highcharts explicit update fix)
    if (window.stockChart.rangeSelector && window.stockChart.rangeSelector.buttons) {
        const btnFill = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        window.stockChart.rangeSelector.buttons.forEach(btn => {
            // Update the background rect
            btn.attr({ fill: btnFill });

            // Update the text styling
            if (btn.text) {
                btn.text.css({ color: fg });
            }
        });
    }
}

function oklchToHex(l, c, h) {
    const rgb = oklchToSrgb(l, c, h);
    return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
}

// --- LIVE PRICING SIMULATION ---
function simulateLivePrice() {
    const elPrice = document.getElementById('stock-price');
    const elChange = document.getElementById('stock-change');
    const elPercent = document.getElementById('stock-change-percent');
    const elContainer = document.getElementById('stock-change-container');

    if (!elPrice || !elChange || !elPercent || !elContainer) return;

    let currentPrice = 192.45;
    let basePrice = 190.07; // Previous close approximation

    setInterval(() => {
        // Random fluctuation between -0.15 and +0.15
        const change = (Math.random() * 0.3) - 0.15;
        currentPrice += change;

        // Calculate diffs
        const diff = currentPrice - basePrice;
        const percent = (diff / basePrice) * 100;

        // Format
        elPrice.innerText = currentPrice.toFixed(2);
        elChange.innerText = (diff >= 0 ? '+' : '') + diff.toFixed(2);
        elPercent.innerText = `(${(diff >= 0 ? '+' : '') + percent.toFixed(2)}%)`;

        // Update Colors
        if (diff >= 0) {
            elContainer.classList.remove('text-negative', 'text-danger');
            elContainer.classList.add('text-positive');
        } else {
            elContainer.classList.remove('text-positive');
            elContainer.classList.add('text-negative');
        }

    }, 3000); // Update every 3 seconds
}

// Start simulation
simulateLivePrice();

// --- EXAMPLE PAGE MOBILE MENU ---
const btnExampleMore = document.getElementById('btn-example-more');
const menuExampleMore = document.getElementById('example-more-menu');

if (btnExampleMore && menuExampleMore) {
    btnExampleMore.addEventListener('click', (e) => {
        e.stopPropagation();
        menuExampleMore.classList.toggle('hidden');
    });

    window.addEventListener('click', () => {
        menuExampleMore.classList.add('hidden');
    });
}

