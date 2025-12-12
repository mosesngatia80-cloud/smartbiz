const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
});

const SaleSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  items: [SaleItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cash' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Sale', SaleSchema);
