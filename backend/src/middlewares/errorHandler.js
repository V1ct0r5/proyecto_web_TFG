const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: err.message });
  };
  
  app.use(errorHandler);