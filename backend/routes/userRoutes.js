const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { name, email } = req.body;
  try {
    let user = await User.findOne({ email }).populate('partners pendingPartners');
    if (!user) {
      user = new User({ name, email });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('partners pendingPartners');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/link-partner', async (req, res) => {
  const { userId, partnerEmail } = req.body;
  try {
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    if (partner._id.toString() === userId) return res.status(400).json({ error: 'Cannot link yourself' });

    if (!partner.pendingPartners.includes(userId) && !partner.partners.includes(userId)) {
      partner.pendingPartners.push(userId);
      await partner.save();
    }
    res.json({ message: 'Request sent to partner' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/accept-partner', async (req, res) => {
  const { userId, partnerId } = req.body;
  try {
    const user = await User.findById(userId);
    const partner = await User.findById(partnerId);
    if (!user || !partner) return res.status(404).json({ error: 'User or Partner not found' });

    user.pendingPartners = user.pendingPartners.filter(id => id.toString() !== partnerId);
    if (!user.partners.includes(partnerId)) user.partners.push(partnerId);
    if (!partner.partners.includes(userId)) partner.partners.push(userId);

    await user.save();
    await partner.save();

    const updatedUser = await User.findById(userId).populate('partners pendingPartners');
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/update-settings', async (req, res) => {
  const { userId, settings } = req.body;
  try {
    const user = await User.findByIdAndUpdate(userId, { settings }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
