// frontend/reactapp/src/utils/progressUtils.js

/**
 * Calcula el porcentaje de progreso de un objetivo cuantitativo.
 * @param {object} objective - El objeto del objetivo.
 * @param {number} objective.initialValue - El valor inicial.
 * @param {number} [objective.currentValue] - El valor actual (opcional, usa initialValue si no se provee).
 * @param {number} objective.targetValue - El valor meta.
 * @param {boolean} objective.isLowerBetter - True si un valor menor es mejor.
 * @returns {number} El porcentaje de progreso (0-100).
 */
export const calculateProgressPercentage = (objective) => {
    const { initialValue, currentValue, targetValue, isLowerBetter } = objective;

    const numInitial = parseFloat(initialValue);
    const numTarget = parseFloat(targetValue);
    const numCurrent = currentValue !== null && currentValue !== undefined
        ? parseFloat(currentValue)
        : numInitial;

    if (isNaN(numInitial) || isNaN(numTarget)) return 0;
    if (numTarget === numInitial) {
        return (isLowerBetter ? numCurrent <= numTarget : numCurrent >= numTarget) ? 100 : 0;
    }

    let progress = isLowerBetter
        ? ((numInitial - numCurrent) / (numInitial - numTarget)) * 100
        : ((numCurrent - numInitial) / (numTarget - numInitial)) * 100;

    return Math.max(0, Math.min(100, Math.round(progress)));
};