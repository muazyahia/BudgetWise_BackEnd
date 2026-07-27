const mongoose = require('mongoose');

const companyBudgetSchema = new mongoose.Schema({
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalBudget: { type: Number, default: 0, min: 0 },
  operatingExpenses: { type: Number, default: 0, min: 0 },
  marketingExpenses: { type: Number, default: 0, min: 0 },
  revenue: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

companyBudgetSchema.virtual('burnRate').get(function() {
  return (this.operatingExpenses + this.marketingExpenses) - this.revenue;
});

companyBudgetSchema.set('toJSON', { virtuals: true });
companyBudgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CompanyBudget', companyBudgetSchema);
