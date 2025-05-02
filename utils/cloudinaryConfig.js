// cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'daczzyh7j',  // Replace with your cloud name
  api_key: '554481782267576',       // Replace with your API key
  api_secret: 'OKpOvrhWInE_PXuazta1QYqPt7Q', // Replace with your API secret
});

module.exports = cloudinary;
