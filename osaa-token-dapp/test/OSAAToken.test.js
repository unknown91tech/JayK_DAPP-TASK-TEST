// test/OSAAToken.test.js - Minimal but comprehensive tests
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OSAAToken Contract", function () {
  let osaaToken, owner, addr1, addr2;

  // Deploy contract before each test
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const OSAAToken = await ethers.getContractFactory("OSAAToken");
    osaaToken = await OSAAToken.deploy();
  });

  describe("🚀 Deployment", function () {
    it("Should set correct name and symbol", async function () {
      expect(await osaaToken.name()).to.equal("OneStep Authentication Asset");
      expect(await osaaToken.symbol()).to.equal("OSAA");
    });

    it("Should assign total supply to owner", async function () {
      const ownerBalance = await osaaToken.balanceOf(owner.address);
      expect(await osaaToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set owner as authorized minter", async function () {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(await osaaToken.authorizedMinters(owner.address)).to.be.true;
    });
  });

  describe("🏭 Minting Functions", function () {
    it("Should mint tokens successfully", async function () {
      const mintAmount = ethers.parseUnits("100", 18);
      
      await osaaToken.mint(addr1.address, mintAmount);
      
      expect(await osaaToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should fail when non-authorized user tries to mint", async function () {
      const mintAmount = ethers.parseUnits("100", 18);
      
      await expect(
        osaaToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWith("Not authorized to mint");
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseUnits("50", 18);
      
      await expect(osaaToken.mint(addr1.address, mintAmount))
        .to.emit(osaaToken, "TokensMinted")
        .withArgs(addr1.address, mintAmount, owner.address);
    });
  });

  describe("📤 Transfer Functions", function () {
    beforeEach(async function () {
      // Give some tokens to owner for transfer tests
      const initialAmount = ethers.parseUnits("1000", 18);
      await osaaToken.mint(owner.address, initialAmount);
    });

    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      
      await osaaToken.transfer(addr1.address, transferAmount);
      
      expect(await osaaToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail if sender has insufficient balance", async function () {
      const largeAmount = ethers.parseUnits("999999", 18);
      
      await expect(
        osaaToken.connect(addr1).transfer(addr2.address, largeAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail transfer to zero address", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      
      await expect(
        osaaToken.transfer(ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });
  });

  describe("🔍 Balance Checking", function () {
    it("Should return correct balance", async function () {
      const mintAmount = ethers.parseUnits("250", 18);
      await osaaToken.mint(addr1.address, mintAmount);
      
      const balance = await osaaToken.getBalance(addr1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("Should return zero for new addresses", async function () {
      const balance = await osaaToken.getBalance(addr2.address);
      expect(balance).to.equal(0);
    });

    it("Should fail for zero address", async function () {
      await expect(
        osaaToken.getBalance(ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot check balance of zero address");
    });
  });

  describe("🔐 Access Control", function () {
    it("Should allow owner to add authorized minter", async function () {
      await osaaToken.addAuthorizedMinter(addr1.address);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(await osaaToken.authorizedMinters(addr1.address)).to.be.true;
    });

    it("Should allow authorized minter to mint", async function () {
      await osaaToken.addAuthorizedMinter(addr1.address);
      const mintAmount = ethers.parseUnits("100", 18);
      
      await osaaToken.connect(addr1).mint(addr2.address, mintAmount);
      expect(await osaaToken.balanceOf(addr2.address)).to.equal(mintAmount);
    });

    it("Should allow owner to remove authorized minter", async function () {
      await osaaToken.addAuthorizedMinter(addr1.address);
      await osaaToken.removeAuthorizedMinter(addr1.address);
      
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(await osaaToken.authorizedMinters(addr1.address)).to.be.false;
    });
  });

  describe("📊 Token Information", function () {
    it("Should return correct token info", async function () {
      const [name, symbol, decimals, totalSupply, maxSupply] = await osaaToken.getTokenInfo();
      
      expect(name).to.equal("OneStep Authentication Asset");
      expect(symbol).to.equal("OSAA");
      expect(decimals).to.equal(18);
      expect(totalSupply).to.be.gt(0);
      expect(maxSupply).to.be.gt(totalSupply);
    });
  });

  describe("⚠️ Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      await expect(
        osaaToken.transfer(addr1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should handle zero amount minting", async function () {
      await expect(
        osaaToken.mint(addr1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should resoect max supply limit", async function (){

      const maxSupply = await osaaToken.maxSupply();
      const currentSupply = await osaaToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseUnits("1",18);

      await expect(
        osaaToken.mint(addr1.address , excessAmount)
      ).to.be.revertedWith("Would exceed maximum supply");
    })
  });
});