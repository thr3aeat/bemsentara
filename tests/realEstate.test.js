const test = require('node:test');
const assert = require('assert');
const Property = require('../models/Property');
const StaffProgress = require('../models/StaffProgress');
const market = require('../bot/services/marketPropertyService');

test('Real Estate MVP buy/sell flow', async (t) => {
  const mockProperty = {
    _id: 'prop101',
    name: 'Test Sektör A',
    description: 'Test',
    baseValue: 2500,
    volatility: 0.05,
    forSale: true,
    ownerId: null,
    save: async function() { return this; }
  };

  const mockStaff = {
    userId: 'user1',
    guildId: 'g',
    gamification: { ecoCoins: 10000 },
    portfolio: [],
    save: async function() { return this; }
  };

  const origFind = Property.find;
  const origFindById = Property.findById;
  const origFindOneStaff = StaffProgress.findOne;

  Property.find = () => ({
    limit: () => ({
      lean: async () => [mockProperty]
    })
  });
  Property.findById = async (id) => id === 'prop101' ? mockProperty : null;
  StaffProgress.findOne = async () => mockStaff;

  try {
    const list = await market.listActiveProperties(4);
    assert.strictEqual(list.length, 1);

    const price = market.computePrice(list[0]);
    const buyRes = await market.buyProperty('user1', list[0]._id, price);
    assert.strictEqual(buyRes.success, true);
    assert.strictEqual(mockProperty.ownerId, 'user1');

    const sellRes = await market.sellProperty('user1', list[0]._id);
    assert.strictEqual(sellRes.success, true);
    assert.strictEqual(mockProperty.ownerId, null);
  } finally {
    Property.find = origFind;
    Property.findById = origFindById;
    StaffProgress.findOne = origFindOneStaff;
  }
});



