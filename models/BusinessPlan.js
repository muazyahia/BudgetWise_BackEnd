const mongoose = require('mongoose');

const businessPlanSchema = new mongoose.Schema({
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyOverview: { type: String, default: '' },
  targetMarket: { type: String, default: '' },
  competitors: { type: String, default: '' },
  marketingStrategy: { type: String, default: '' },
  financialProjections: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('BusinessPlan', businessPlanSchema);
