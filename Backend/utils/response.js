const sendResponse = (res, statusCode, message, data = null) => {
    const response = {
        success: statusCode,
        message: message,
        data: data,
    };
    res.status(statusCode).json(response);
};

export default sendResponse;
