var SupplyChain = artifacts.require('SupplyChain')

contract('test for the supply chain smart contract', function(accounts){

const owner = accounts[0]
const alice = accounts[1]
const bob = accounts[2]
const emptyAddress = '0x0000000000000000000000000000000000000000'

let deployedContract;
var name = 'book'
const price = '1000'
var sku
var eventEmitted = false
var result
var returnName

beforeEach('', async () => {
  deployedContract = await SupplyChain.deployed();
});


it('should add an item with the provided name and price', async () => {


  var nameBytes = web3.utils.fromAscii(name);
  const tx = await deployedContract.addItem(nameBytes , price, {from: alice});

  if(tx.logs[0].event === 'ForSale'){

    sku = tx.logs[0].args.sku.toString(10)
    eventEmitted = true;

  }

  try{
    result = await deployedContract.items.call(sku);
    returnName = result[0].replace(/^\s+|0+$/g, ' ')
    }
    catch(err){
      console.log(err.message)
    }

  assert.equal(returnName.trim() , nameBytes ,'the name of the last added item does not match the expected value')
  assert.equal(result[1].toString(10), sku,'sku ')
  assert.equal(result[2].toString(10), price,'the price of the last added item does not match the expected value')
  assert.equal(result[3], 0, 'the state of the item should be "For Sale", which should be declared first in the State Enum')
  assert.equal(result[4], alice, 'the address adding the item should be listed as the seller')
  assert.equal(result[5], emptyAddress,'the buyer address should be set to 0 when an item is added')
  assert.equal(eventEmitted, true,'adding an item should emit a For Sale event')

  });

  it('should allow someone to purchase an item' , async () => {

    const amount = '2000'

    try {
      var aliceBalanceBefore = await web3.eth.getBalance(alice)
      var bobBalanceBefore = await web3.eth.getBalance(bob)
      const tx = await deployedContract.buyItem(sku, {from:bob, value:amount})
      if(tx.logs[0].event === 'Sold'){
      sku = tx.logs[0].args.sku.toString(10)
      eventEmitted = true
    }
      var aliceBalanceAfter = await web3.eth.getBalance(alice)
      var bobBalanceAfter = await web3.eth.getBalance(bob)
      result = await deployedContract.items.call(sku)
      }
    catch(e){
      console.log(e.message);
    }
    assert.equal(result[3].toString(10),1,'the state of the item should be "Sold", which should be declared second in the State Enum')
    assert.equal(result[5],bob,'the buyer address should be set bob when he purchases an item')
    assert.equal(eventEmitted, true, 'adding an item should emit a Sold event')
    assert.equal(parseInt(aliceBalanceAfter), parseInt(aliceBalanceBefore, 10) + parseInt(price, 10), "alice's balance should be increased by the price of the item")
    assert.isBelow(parseInt(bobBalanceAfter), parseInt(bobBalanceBefore, 10) - parseInt(price, 10), "bob's balance should be reduced by more than the price of the item (including gas costs)")

  });

  it('should allow the seller to mark the item as shipped', async () => {

    try {

      const tx = await deployedContract.shipItem(sku, {from: alice})
      if(tx.logs[0].event === 'Shipped'){
        sku = tx.logs[0].args.sku.toString(10)
        eventEmitted = true
      }

      result = await deployedContract.items.call(sku);

    } catch (e) {
      console.log(e.message);
    }
    assert.equal(eventEmitted , true,'adding an item should emit a Shipped event')
    assert.equal(result[3].toString(10),2,'the state of the item should be "Shipped", which should be declared third in the State Enum')
  });

  it('should allow the buyer to mark the item as received', async () => {
    try {

      const tx = await deployedContract.receiveItem(sku , {from: bob})
      if(tx.logs[0].event === 'Received'){

        sku = tx.logs[0].args.sku.toString(10)
        eventEmitted = true
      }

      result = await deployedContract.items.call(sku)
    } catch (e) {
      console.log(e.message);
    }

    assert.equal(eventEmitted , true,'adding an item should emit a Received event')
    assert.equal(result[3].toString(10),3,'the state of the item should be "Received", which should be declared third in the State Enum')
  });

});
