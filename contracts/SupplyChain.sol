pragma solidity ^0.5.0;

contract SupplyChain {

  // Owner is the person who deploy the smartContract
  address owner;
  // skuCount to track the most recent sku # */
  uint public skuCount;

  struct Item {
    bytes24 name;
    uint sku;
    uint price;
    uint state;
    address payable seller;
    address payable buyer;


  }

  /* A public mapping that maps the SKU (a number) to an Item defined in the Struct Item.

  */
  mapping(uint => Item) public items;

  // Possible states of an item at any given time in its supplyChain life cycle
  enum State {ForSale, Sold, Shipped, Received}

  event ForSale(uint sku);
  event Sold(uint sku);
  event Shipped(uint sku);
  event Received(uint sku);

  modifier paidEnough(uint _price){ require(msg.value >= _price); _; }
  modifier checkValue(uint _sku){
    _;
    Item storage myItem = items[_sku];

    uint amountToRefund = msg.value - myItem.price;
    myItem.buyer.transfer(amountToRefund);
  }

  modifier verifyCaller(address _address){
    require(msg.sender == _address);
    _;
  }
  modifier forSale(uint _sku){ require(items[_sku].state == uint(State.ForSale)); _; }
  modifier sold(uint _sku){require(items[_sku].state == uint(State.Sold)); _; }
  modifier shipped(uint _sku){

    require(items[_sku].state == uint(State.Shipped));
    _;
  }

  constructor() public {
    owner = msg.sender;
    skuCount = 0;
  }

  // functions

  function addItem(bytes24 _name, uint _price) public returns(uint ){
    emit ForSale(skuCount);

    items[skuCount] = Item({name: _name, sku: skuCount, price: _price, state: uint(State.ForSale), seller: msg.sender, buyer: address(0)});
    skuCount = skuCount + 1;

    //result = true;
    return skuCount;

  }

  function receiveItem(uint _shippedItemSku) public shipped(_shippedItemSku) verifyCaller(items[_shippedItemSku].buyer) {
    Item storage myItem = items[_shippedItemSku];

    myItem.state = uint(State.Received);
    emit Received(_shippedItemSku);
  }

  function shipItem(uint _itemToShipSku) public sold(_itemToShipSku) verifyCaller(items[_itemToShipSku].seller){

    items[_itemToShipSku].state = uint(State.Shipped);
    emit Shipped(_itemToShipSku);
  }

  function buyItem(uint _itemToBuySku)
    public payable forSale(_itemToBuySku) paidEnough(items[_itemToBuySku].price) checkValue(_itemToBuySku)

  {
    Item storage myItem = items[_itemToBuySku];
    //Setting the state of the item to sold should be done first so that other buyer will not be allowed to buy the same item at the same time.
    myItem.state = uint(State.Sold);
    //Transfer of ownership should happen befor transfering value. Otherwise, the transfer of value will not happen
    myItem.buyer = msg.sender;
    myItem.seller.transfer(myItem.price);
    //myItem.buyer = msg.sender;

    emit Sold(_itemToBuySku);
  }

  function fetchItem(uint _skuNo) view public returns(bytes24 _name, uint _sku, uint _price, address _seller, address _buyer, uint _state){

    require(_skuNo > 0);

    _name = items[_skuNo].name;
    _sku = items[_skuNo].sku;
    _price = items[_skuNo].price;
    _seller = items[_skuNo].seller;
    _buyer = items[_skuNo].buyer;
    _state = uint(items[_skuNo].state);

    return (_name, _sku, _price, _seller, _buyer, _state);

  }


}
