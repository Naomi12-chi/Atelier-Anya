const mongoose = require('mongoose');
require('dotenv').config({path:'./backend/.env'});
const Product = require('./backend/models/product');
mongoose.connect(process.env.MONGODB_URI).then(async ()=>{
  const products = await Product.find();
  for(let i=0;i<products.length;i++){
    const p = products[i];
    const name = (p.name||'').toLowerCase();
    if(name.indexOf('perfume')>=0 || name.indexOf('amber')>=0){ p.productImage='/images/amberparfum.png'; }
    else if(name.indexOf('cleanser')>=0){ p.productImage='/images/rosecleanser.jpg'; }
    else if(name.indexOf('palette')>=0){ p.productImage='/images/rosegoldpalette.jpg'; }
    else if(p.category==='Fragrance'){ p.productImage='/images/fragrance.png'; }
    else if(p.category==='Makeup'){ p.productImage='/images/makeup.png'; }
    else if(p.category==='Skincare'){ p.productImage='/images/skincare.png'; }
    else if(p.category==='Bodycare'){ p.productImage='/images/bodycare.png'; }
    else { p.productImage='/images/placeholder.jpg'; }
    await p.save();
    console.log(p.name);
  }
  console.log('done');
  process.exit(0);
}).catch(e=>{console.error(e.message);process.exit(1);});
