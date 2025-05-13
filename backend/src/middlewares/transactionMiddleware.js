const db = require("../config/database");

const transactionMiddleware = async (req, res, next) => {
    // Solo aplicar este middleware en entorno de test
    if (process.env.NODE_ENV !== "test") {
        return next();
    }

    let transaction;
    try {
        // Iniciar una nueva transacción
        transaction = await db.sequelize.transaction(); // Adjuntar la transacción al objeto request
        req.transaction = transaction;
        console.log("[Transaction Middleware] Transaction started for request."); // Continuar con la cadena de middlewares/rutas

        next();
    } catch (error) {
        console.error(
            "[Transaction Middleware] Error starting transaction:",
            error
        ); // Si falla al iniciar la transacción, pasar el error al manejador de errores
        next(error);
    } finally {
    // Importante: La transacción debe ser revertida o confirmada.
    // En los tests, queremos revertir SIEMPRE para aislamiento.
    // Esto se haría en el `afterEach` del test, NO en el middleware aquí directamente,
    // ya que `next()` es asíncrono y el middleware no espera a que la respuesta termine.
    // La lógica de commit/rollback DEBE ESTAR EN EL TEST `afterEach`.
    // Este middleware solo INICIA y ADJUNTA la transacción.
    // La lógica de rollback en afterEach en los tests ya está correcta.
    }
    };

    module.exports = transactionMiddleware;
