const errorHandler = (err, req, res, next) => {
  // Es una buena práctica registrar el error completo para depuración interna
  console.error('Error capturado por el middleware de errores:', err);
  console.error('Stack del error:', err.stack);

  // Determinar el código de estado y el mensaje de error.
  // Puedes personalizar esto para diferentes tipos de errores (ej. SequelizeValidationError, JWT errors).
  const statusCode = err.status || 500;
  const message = err.message || 'Error interno del servidor.';

  // Para evitar exponer detalles sensibles del error en producción
  // podrías tener una lógica que diga:
  // if (process.env.NODE_ENV === 'production' && statusCode === 500) {
  //     message = 'Ocurrió un error inesperado en el servidor.';
  // }

  res.status(statusCode).json({
      message: message,
      // Puedes añadir un campo 'errors' si err.errors existe y es relevante
      // errors: err.errors ? err.errors.map(e => e.message) : undefined
  });
};

module.exports = errorHandler;