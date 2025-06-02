const db = require("../config/database");

const transactionMiddleware = async (req, res, next) => {
    if (process.env.NODE_ENV !== "test") {
        return next();
    }

    let transaction;
    try {
        transaction = await db.sequelize.transaction();
        req.transaction = transaction;

        res.on('finish', async () => {
            if (transaction && !transaction.finished) {
                // Es crucial que res.locals_error sea establecido por un manejador de errores
                // si un error ocurre antes de que se envíe la respuesta pero el status es < 400.
                if (res.statusCode < 400 && !res.locals_error) {
                    try {
                        await transaction.commit();
                    } catch (commitError) {
                        console.error("[Transaction Middleware] Error committing transaction:", commitError, "for request:", req.path);
                        if (!transaction.finished) {
                            try {
                                await transaction.rollback();
                            } catch (finalRollbackError) {
                                console.error("[Transaction Middleware] Error rolling back after commit error for request:", req.path, finalRollbackError);
                            }
                        }
                    }
                } else {
                    try {
                        await transaction.rollback();
                    } catch (rollbackError) {
                        console.error("[Transaction Middleware] Error rolling back transaction:", rollbackError, "for request:", req.path);
                    }
                }
            }
        });

        next();

    } catch (error) {
        console.error("[Transaction Middleware] Error starting transaction:", error, "for request:", req.path);
        if (transaction && !transaction.finished) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("[Transaction Middleware] Error rolling back transaction after start error:", rollbackError, "for request:", req.path);
            }
        }
        next(error);
    }
};

module.exports = transactionMiddleware;