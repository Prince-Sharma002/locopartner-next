const User = require('../models/User');

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

module.exports = (io) => {
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    socket.on('join', async (userId) => {
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    socket.on('updateLocation', async (data) => {
      const { userId, latitude, longitude } = data;
      try {
        const user = await User.findById(userId).populate('partners');
        if (!user) return;

        user.location.coordinates = [longitude, latitude];
        user.lastUpdated = Date.now();
        await user.save();

        if (user.partners && !user.settings.isSharingPaused && !user.settings.isInvisible) {
          user.partners.forEach(partner => {
             const distance = getDistance(
               latitude, longitude,
               partner.location.coordinates[1], partner.location.coordinates[0]
             );
             const partnerSocketId = activeUsers.get(partner._id.toString());
             if (partnerSocketId) {
               io.to(partnerSocketId).emit('partnerLocationUpdate', {
                 partnerId: user._id,
                 partnerName: user.name,
                 latitude,
                 longitude,
                 distance,
                 visibilityType: user.settings.visibilityType
               });
             }
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('updateMood', async (data) => {
      const { userId, mood } = data;
      try {
        const user = await User.findByIdAndUpdate(userId, { mood }, { new: true }).populate('partners');
        if (user && user.partners) {
          user.partners.forEach(partner => {
            const partnerSocketId = activeUsers.get(partner._id.toString());
            if (partnerSocketId) {
              io.to(partnerSocketId).emit('partnerMoodUpdate', { partnerId: user._id, partnerName: user.name, mood });
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) activeUsers.delete(socket.userId);
    });
  });
};
