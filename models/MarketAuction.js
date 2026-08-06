const { collections } = require("./Store");
const marketAuctions = collections.marketAuctions;

/**
 * Pazar Yeri & Açık Arttırma İlan Modeli
 */
const MarketAuction = {
  findOne(query) {
    return Promise.resolve(marketAuctions.findOne(query));
  },
  find(query) {
    return Promise.resolve(marketAuctions.find(query));
  },
  create(data) {
    const defaults = {
      sellerId: "",
      guildId: "",
      itemType: "PROPERTY", // PROPERTY, BADGE, COIN, ELMAS
      itemId: "",
      itemName: "İlan Ürünü",
      description: "",
      startingPrice: 100,
      currentBid: 100,
      highestBidderId: null,
      buyoutPrice: null, // Sabit satın alma fiyatı
      status: "ACTIVE", // ACTIVE, SOLD, CANCELLED, EXPIRED
      expiresAt: new Date(Date.now() + 86400000 * 3), // 3 gün
      createdAt: new Date(),
    };
    return Promise.resolve(marketAuctions.create({ ...defaults, ...data }));
  }
};

function MarketAuctionConstructor(data) {
  const defaults = {
    sellerId: "",
    guildId: "",
    itemType: "PROPERTY",
    itemId: "",
    itemName: "İlan Ürünü",
    description: "",
    startingPrice: 100,
    currentBid: 100,
    highestBidderId: null,
    buyoutPrice: null,
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + 86400000 * 3),
    createdAt: new Date(),
  };
  const merged = { ...defaults, ...data };
  merged.save = function () {
    if (merged._id && marketAuctions.data.has(merged._id)) {
      merged.updatedAt = new Date();
      const stored = { ...merged };
      delete stored.save;
      marketAuctions.data.set(merged._id, stored);
      marketAuctions.persist();
      return Promise.resolve(merged);
    }
    const created = marketAuctions.create(merged);
    Object.assign(merged, created);
    return Promise.resolve(merged);
  };
  return merged;
}

MarketAuctionConstructor.findOne = MarketAuction.findOne;
MarketAuctionConstructor.find = MarketAuction.find;
MarketAuctionConstructor.create = MarketAuction.create;

module.exports = MarketAuctionConstructor;
