const mongoose = require('mongoose');
require('dotenv').config({path: './backend/.env'});
const Product = require('./backend/models/product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('connected');
  const products = await Product.find();
  console.log('products:', products.length);
  for (let p of products) {
    const name = (p.name || '').toLowerCase();
    if (name.includes('perfume') || name.includes('amber')) {
      p.productImage = '/images/amberparfum.png';
    } else if (name.includes('cleanser')) {
      p.productImage = '/images/rosecleanser.jpg';
    } else if (name.includes('palette') || name.includes('gold')) {
      p.productImage = '/images/rosegoldpalette.jpg';
    } else if (p.category === 'Fragrance') {
      p.productImage = '/images/fragrance.png';
    } else if (p.category === 'Makeup') {
      p.productImage = '/images/makeup.png';
    } else if (p.category === 'Skincare') {
      p.productImage = '/images/skincare.png';
    } else if (p.category === 'Bodycare') {
      p.productImage = '/images/bodycare.png';
    } else {
      p.productImage = '/images/placeholder.jpg';
    }
    await p.save();
    console.log('updated', p.name, '->', p.productImage);
  }
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
