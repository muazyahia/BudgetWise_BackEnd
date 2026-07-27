
// دالة معالجة الأخطاء العامة
const errorHandler = (err, req, res, next) => {
  let status = res.statusCode === 200 ? 500 : res.statusCode;
  let message = 'Internal server error';

  // 1. Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    message = 'Invalid input data: ' + messages.join(', ');
    status = 400;
  }
  // 2. CastError
  else if (err.name === 'CastError') {
    message = 'Invalid identifier';
    status = 400;
  }
  // 3. Duplicate key (11000)
  else if (err.code === 11000) {
    message = 'This data already exists';
    status = 400;
  }
  // 4. JWT errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    message = 'Invalid or expired token';
    status = 401;
  } else if (err.message) {
    // If it's a generic error but we explicitly set a message and it wasn't caught above
    if (status !== 500) {
        message = err.message;
    }
  }

  res.status(status).json({
    success: false,
    message: message,
    error: err.message || err
  });
};

module.exports = errorHandler;
