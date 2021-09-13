const { expect } = require('chai');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const constants = require('@openzeppelin/test-helpers/src/constants');

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
    const startSale = await contract.setSaleStatus(false);

    const paused = await contract.getSaleStatus();
    expect(paused).to.be.false;
    expectEvent(startSale, 'SaleStarted', { 'started': true });
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

  /* Test the getMyAssets function */
  it('should return that you own no CryptoSuit asserts', async () => {
    const assets = await contract.getMyAssets();
    expect(assets).to.be.empty;
  })

  /* Test the mint function */
  it('should mint some CryptoSuit NFTs', async () => {
    await contract.setSaleStatus(false);

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

  /* Test the giveaway function */
  it('should giveaway some CryptoSuit NFTs', async () => {
    await contract.setSaleStatus(false);

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

  /* Test the withdraw function */
  it('should withdraw the money from the contract', async () => {
    await contract.setSaleStatus(false);
  });
});