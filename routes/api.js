'use strict';

let stockLikes = {}; // In-memory storage for likes and IPs

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const stock = req.query.stock;
      const like = req.query.like === 'true';
      const stocks = Array.isArray(stock) ? stock : [stock];

      try {
        const stockData = await Promise.all(stocks.map(async (s) => {
          const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${s}/quote`);
          const data = await response.json();

          // Ensure stockLikes[s] and stockLikes[s].ips are initialized properly
          if (!stockLikes[s]) {
            stockLikes[s] = { likes: 0, ips: [] };
          }

          if (like) {
            const hashedIp = hashIp(req.ip);
            
            // Initialize ips array if not present
            if (!stockLikes[s].ips) {
              stockLikes[s].ips = [];
            }

            // Ensure the 'ips' array exists before checking with includes
            if (!stockLikes[s].ips.includes(hashedIp)) {
              stockLikes[s].likes += 1;
              stockLikes[s].ips.push(hashedIp);
            }
          }

          return {
            stock: data.symbol,
            price: data.latestPrice,
            likes: stockLikes[s].likes
          };
        }));

        if (stockData.length === 1) {
          res.json({ stockData: stockData[0] });
        } else {
          const rel_likes_1 = stockData[0].likes - stockData[1].likes;
          const rel_likes_2 = stockData[1].likes - stockData[0].likes;
          stockData[0].rel_likes = rel_likes_1;
          stockData[1].rel_likes = rel_likes_2;
          res.json({ stockData });
        }
      } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
      }
    });

  function hashIp(ip) {
    return require('crypto').createHash('sha256').update(ip).digest('hex');
  }
};
