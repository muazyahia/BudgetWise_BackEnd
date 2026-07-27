const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    // Get notifications for this user OR global notifications (userId: null)
    const notifications = await Notification.find({
      $or: [{ userId: req.user?._id }, { userId: null }]
    }).sort({ createdAt: -1 }).limit(20);
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ userId: req.user?._id }, { userId: null }], isRead: false }, 
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ $or: [{ userId: req.user?._id }, { userId: null }] });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getNotifications, 
  markAsRead, 
  deleteNotification, 
  clearAllNotifications 
};
