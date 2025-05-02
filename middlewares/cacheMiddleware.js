const Redis = require("ioredis");
const redisClient = new Redis();

redisClient.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err);
});



// ✅ Middleware to check Redis cache
const cacheMiddleware = async (req, res, next) => {
  try {
    const cacheKey = `cache:${req.originalUrl}`; 
    const cacheData = await redisClient.get(cacheKey);

    if (cacheData) {
      console.log("✅ Cache Hit:", cacheKey);
      return res.status(200).json(JSON.parse(cacheData));
    }
    

    const redisClient = new Redis({ host: '127.0.0.1', port: 6379 });


    console.log("⚠️ Cache Miss:", cacheKey);
    
    // Override res.json to store response in Redis
    const sendResponse = res.json.bind(res);
    res.json = (body) => {
      redisClient.set(cacheKey, JSON.stringify(body), "EX", 3600) // Cache for 1 hour
        .catch(err => console.error("❌ Redis Set Error:", err));
      sendResponse(body);
    };

    next();
  } catch (err) {
    console.error("❌ Redis Middleware Error:", err);
    next(); // Continue request even if Redis fails
  }
};

module.exports = cacheMiddleware;
