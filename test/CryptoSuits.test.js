const { expect } = require('chai');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const CryptoSuits = artifacts.require("CryptoSuits");

contract('CryptoSuits', ([owner, buyer, winner]) => {
  let contract;

  beforeEach('deploy a new contract for each test', async function () {
    contract = await CryptoSuits.new({ from: owner });
  })


  /* Test the saleStatus getter/setter */
  it("should return that the sale has not started yet", async () => {
    const paused = await contract.getSaleStatus();
    expect(paused).to.be.true;

    const mintedTokens = await contract.getNumberofMintedTokens();
    expect(mintedTokens).to.be.bignumber.equal(new BN('0'));
  });

  it("should start the sale", async () => {
    const startSale = await contract.updateSaleStatus(false);

    const paused = await contract.getSaleStatus();
    expect(paused).to.be.false;
    expectEvent(startSale, 'SaleStatusUpdated', { 'paused': false });
  });

  it('should fail to call the function updateSaleStatus() because it is not called by the owner', async () => {
    await expectRevert(
      contract.updateSaleStatus(false, { from: buyer}),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
  });


  /* Test the baseURI getter/setter */
  it('should return the default baseURI', async () => {
    const baseURI = await contract.getBaseURI();
    expect(baseURI).to.equal('https://cryptosuit-api.herokuapp.com/json/');
  });

  it('should update the baseURI', async () => {
    const newBaseURI = 'newbaseuri/test';
    await contract.setBaseUri(newBaseURI);

    const baseURI = await contract.getBaseURI();
    expect(baseURI).to.equal(newBaseURI);
  });

  it('should fail to call the function setBaseUri() because it is not called by the owner', async () => {
    await expectRevert(
      contract.setBaseUri('test', { from: buyer}),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
  });


  /* Test the price setter */
  it('should update the price', async () => {
    const newPrice = 0.1 * 10e17;
    const oldPrice = 0.033 * 10e17;
    
    await contract.setPrice(new BN(newPrice.toString()));
    
    await contract.updateSaleStatus(false);

    await contract.mint(buyer, 1, { value: newPrice });

    await expectRevert(
      contract.mint(buyer, 1, { value: oldPrice }),
      'Wrong price, don\'t fuck around!.',
    );
  });

  it('should fail to call the function setPrice() because it is not called by the owner', async () => {
    const newPrice = 2 * 10e17;
    await expectRevert(
      contract.setPrice(new BN(newPrice.toString()), { from: buyer}),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
  });


  /* Test the totalSupply setter */
  it('should update the total supply', async () => {
    const newTotalSupply = 160; // 150 are "reserved" for the giveaways
    await contract.setTotalSupply(newTotalSupply);
    
    await contract.updateSaleStatus(false);

    await expectRevert(
      contract.mint(buyer, 11, { value: 11 * 0.033 * 10e17 }),
      'Exceending maximum supply',
    ); 
  });

  it('should fail to call the function setTotalSupply() because it is not called by the owner', async () => {
    await expectRevert(
      contract.setTotalSupply(10, { from: buyer}),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
  });


  /* Test the maximumPurchase setter */
  it('should update the maximum purchase value', async () => {
    const newMaxPurchase = 5;
    await contract.setMaxPurchase(newMaxPurchase);
    
    await contract.updateSaleStatus(false);

    await expectRevert(
      contract.mint(buyer, 6, { value: 6 * 0.033 * 10e17 }),
      'You can\'t buy that much tokens in a transaction (maximum is 20)',
    ); 
  });

  it('should fail to call the function setMaxPurchase() because it is not called by the owner', async () => {
    await expectRevert(
      contract.setMaxPurchase(100, { from: buyer}),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
  });


  /* Test the getMyAssets function */
  it('should return that you own no CryptoSuit asserts', async () => {
    const assets = await contract.getMyAssets();
    expect(assets).to.be.empty;
  })


  /* Test the mint function */
  it('should mint some CryptoSuit NFTs', async () => {
    await contract.updateSaleStatus(false);

    const quantity = 2;

    const mint = await contract.mint(buyer, quantity, { value: quantity * 0.033 * 10e17 });
    expectEvent(mint, 'Mint', {
      'minterAddress':  owner,
      'buyerAddress':   buyer,
      'tokenId':        new BN('1'),
    });
    expectEvent(mint, 'Mint', {
      'minterAddress':  owner,
      'buyerAddress':   buyer,
      'tokenId':        new BN('2'),
    });

    const mintedTokens = await contract.getNumberofMintedTokens();
    expect(mintedTokens).to.be.bignumber.equal(quantity.toString());

    const assetsOwnedByAddress = await contract.getAssetsByOwner(buyer);
    expect(assetsOwnedByAddress.length).to.equal(quantity);
  });

  it('should fail when minting a CryptoSuit because the sale has not started', async () => {
    await expectRevert(
      contract.mint(buyer, 1, { value: 0.033 * 10e17 }),
      'The sale has not started yet',
    );
  });

  it('should fail when minting a CryptoSuit because the quantity is negative', async () => {
    await contract.updateSaleStatus(false);
    
    await expectRevert(
      contract.mint(buyer, -1, { value: 0.033 * 10e17 }),
      'value out-of-bounds (argument="quantity", value=-1, code=INVALID_ARGUMENT, version=abi/5.0.7)',
    );
  });

  it('should fail when minting a CryptoSuit because the quantity is superior to the max purchase', async () => {
    await contract.updateSaleStatus(false);
    
    await expectRevert(
      contract.mint(buyer, 21, { value: 21 * 0.033 * 10e17 }),
      'You can\'t buy that much tokens in a transaction (maximum is 20)',
    );
  });

  it('should fail when minting a CryptoSuit because the price is not correct', async () => {
    await contract.updateSaleStatus(false);
    
    await expectRevert(
      contract.mint(buyer, 1, { value: 100 }),
      'Wrong price, don\'t fuck around!',
    );
  });


  /* Test the giveaway function */
  it('should giveaway some CryptoSuit NFTs', async () => {
    await contract.updateSaleStatus(false);

    const quantity = 2;

    const giveaway = await contract.giveaway(winner, quantity);
    expectEvent(giveaway, 'GiveAway', {
      'minterAddress':  owner,
      'winnerAddress':  winner,
      'tokenId':        new BN('1'),
    });
    expectEvent(giveaway, 'GiveAway', {
      'minterAddress':  owner,
      'winnerAddress':  winner,
      'tokenId':        new BN('2'),
    });

    const mintedTokens = await contract.getNumberofMintedTokens();
    expect(mintedTokens).to.be.bignumber.equal(quantity.toString());

    const assetsOwnedByAddress = await contract.getAssetsByOwner(winner);
    expect(assetsOwnedByAddress.length).to.equal(quantity);
  });

  it('should fail to call the function giveaway() because it is not called by the owner', async () => {
    await expectRevert(
      contract.giveaway(winner, 2, { from: buyer}),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
  });


  /* Test the withdraw function */
  it('should withdraw the money from the contract', async () => {
    await contract.updateSaleStatus(false);

    const quantity = 10;
    await contract.mint(buyer, quantity, { value: quantity * 0.033 * 10e17 });
  
    const previousBalance = await web3.eth.getBalance(owner);

    await contract.withdraw();

    const newBalance = await web3.eth.getBalance(owner);
    expect(newBalance).to.not.equal(previousBalance);
  });

  it('should fail to call the function withdraw() because it is not called by the owner', async () => {
    await expectRevert(
      contract.withdraw({ from: buyer}),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
  });
});