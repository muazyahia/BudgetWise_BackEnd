const BusinessPlan = require('../models/BusinessPlan');
const CompanyBudget = require('../models/CompanyBudget');

const getBusinessPlan = async (req, res, next) => {
  try {
    if (req.user.role !== 'founder') {
      res.status(403);
      throw new Error('Only founders can access this');
    }
    let plan = await BusinessPlan.findOne({ founder: req.user._id });
    if (!plan) {
      plan = await BusinessPlan.create({ founder: req.user._id });
    }
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

const updateBusinessPlan = async (req, res, next) => {
  try {
    if (req.user.role !== 'founder') return res.status(403).json({ message: 'Forbidden' });
    const plan = await BusinessPlan.findOneAndUpdate(
      { founder: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

const getCompanyBudget = async (req, res, next) => {
  try {
    if (req.user.role !== 'founder') return res.status(403).json({ message: 'Forbidden' });
    let budget = await CompanyBudget.findOne({ founder: req.user._id });
    if (!budget) {
      budget = await CompanyBudget.create({ founder: req.user._id });
    }
    res.json({ success: true, data: budget });
  } catch (err) { next(err); }
};

const updateCompanyBudget = async (req, res, next) => {
  try {
    if (req.user.role !== 'founder') return res.status(403).json({ message: 'Forbidden' });
    const budget = await CompanyBudget.findOneAndUpdate(
      { founder: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: budget });
  } catch (err) { next(err); }
};

module.exports = {
  getBusinessPlan,
  updateBusinessPlan,
  getCompanyBudget,
  updateCompanyBudget
};
