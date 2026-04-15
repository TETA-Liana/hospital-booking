const prisma = require('../config/db');
const { success, ApiError } = require('../utils/apiResponse');

// GET /api/notifications
async function listNotifications(req, res) {
  const { unreadOnly } = req.query;
  const where = { userId: req.user.id };
  if (unreadOnly === 'true') where.isRead = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });

  return success(res, 200, 'Notifications fetched', notifications, { unreadCount });
}

// PUT /api/notifications/:id/read
async function markRead(req, res) {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) {
    throw new ApiError(404, 'Notification not found');
  }
  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  return success(res, 200, 'Notification marked as read', updated);
}

// PUT /api/notifications/read-all
async function markAllRead(req, res) {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  return success(res, 200, 'All notifications marked as read');
}

module.exports = { listNotifications, markRead, markAllRead };
