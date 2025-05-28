export const PREDEFINED_CATEGORY_COLORS = {
    'Salud': '#40E0D0',
    'Finanzas': '#6B8E23',
    'Desarrollo personal': '#FFEA00',
    'Relaciones': '#FFDAB9',
    'Carrera profesional': '#800020',
    'Otros': '#F5EAAA'
};

export const FALLBACK_COLOR_PALETTE = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
    '#8B5CF6', '#D946EF', '#0EA5E9', '#64748B', '#F97316',
    '#EAB308', '#22C55E', '#0D9488', '#0E7490', '#BE185D'
];

export function adjustHexColorBrightness(hex, percent) {
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    let r = parseInt(hex.substring(0, 2), 16),
        g = parseInt(hex.substring(2, 4), 16),
        b = parseInt(hex.substring(4, 6), 16);

    const p = percent / 100;
    r = Math.min(255, Math.max(0, Math.round(r * (1 + p))));
    g = Math.min(255, Math.max(0, Math.round(g * (1 + p))));
    b = Math.min(255, Math.max(0, Math.round(b * (1 + p))));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function getCategoryChartColors(dataItems) {
    const backgroundColors = [];
    const borderColors = [];
    
    if (!dataItems || dataItems.length === 0) {
        return { backgroundColors, borderColors };
    }

    let fallbackColorIndex = 0;
    const assignedFallbackColorsInThisDataset = new Set();

    dataItems.forEach(item => {
        let baseColor;

        if (item.color) {
            baseColor = item.color;
        } else if (PREDEFINED_CATEGORY_COLORS[item.name]) {
            baseColor = PREDEFINED_CATEGORY_COLORS[item.name];
        } else {
            let foundFallbackColor = false;
            for (let i = 0; i < FALLBACK_COLOR_PALETTE.length; i++) {
                const potentialColor = FALLBACK_COLOR_PALETTE[(fallbackColorIndex + i) % FALLBACK_COLOR_PALETTE.length];
                if (!assignedFallbackColorsInThisDataset.has(potentialColor)) {
                    baseColor = potentialColor;
                    assignedFallbackColorsInThisDataset.add(baseColor);
                    foundFallbackColor = true;
                    break;
                }
            }
            if (!foundFallbackColor) {
                baseColor = FALLBACK_COLOR_PALETTE[fallbackColorIndex % FALLBACK_COLOR_PALETTE.length];
            }
            fallbackColorIndex++;
        }
        
        backgroundColors.push(baseColor); 
        borderColors.push(adjustHexColorBrightness(baseColor, -20));
    });

    return { backgroundColors, borderColors };
}