// backend/src/middlewares/transactionMiddleware.js
const db = require("../config/database");

/**
 * Middleware de transacción AUTOMÁTICA SÓLO PARA ENTORNO DE PRUEBAS (TESTING).
 *
 * Propósito:
 * Este middleware envuelve cada petición de prueba en una transacción de Sequelize.
 * Al finalizar la petición, realiza un COMMIT si la respuesta fue exitosa (status < 400)
 * o un ROLLBACK si hubo un error. Esto asegura que la base de datos se mantenga limpia
 * entre cada caso de prueba de integración, ya que los cambios de cada prueba se deshacen.
 *
 * IMPORTANTE: No activar este middleware en entornos de desarrollo o producción,
 * ya que la gestión explícita de transacciones en los servicios es más segura y robusta.
 */
const transactionMiddleware = async (req, res, next) => {
    // Se ejecuta únicamente en el entorno 'test'.
    if (process.env.NODE_ENV !== "test") {
        return next();
    }

    let transaction;
    try {
        transaction = await db.sequelize.transaction();
        req.transaction = transaction; // Adjunta la transacción al objeto de la petición

        // Escucha el evento 'finish', que se dispara cuando la respuesta se ha enviado.
        res.on('finish', async () => {
            // Asegurarse de que la transacción no haya sido finalizada previamente.
            if (transaction && !transaction.finished) {
                try {
                    // Si el código de estado indica éxito, confirma la transacción.
                    if (res.statusCode < 400) {
                        await transaction.commit();
                    } else {
                        // Si hubo un error, revierte la transacción.
                        await transaction.rollback();
                    }
                } catch (transactionError) {
                    console.error("[Transaction Middleware] Error al finalizar la transacción:", transactionError);
                    // Intento final de rollback si el commit falla.
                    if (!transaction.finished) {
                        await transaction.rollback();
                    }
                }
            }
        });

        next();

    } catch (error) {
        console.error("[Transaction Middleware] Error al iniciar la transacción:", error);
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        next(error); // Pasa el error al manejador global.
    }
};

module.exports = transactionMiddleware;