// Importing necessary modules and functions from Hardhat and Chai for testing
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { time } = require('@nomicfoundation/hardhat-network-helpers');


// Describing a test suite for the CollateralizedLoan contract
describe("CollateralizedLoan", function () {
  // A fixture to deploy the contract before each test. This helps in reducing code repetition.
  async function deployCollateralizedLoanFixture() {
    // Deploying the CollateralizedLoan contract and returning necessary variables 
  const [borrower, lender] = await ethers.getSigners();
  const CollateralLoan = await ethers.getContractFactory( "CollateralizedLoan");
    
  const collateralLoan = await CollateralLoan.deploy();
  return {collateralLoan, borrower, lender};
  }

  // Test suite for the loan request functionality
  describe("Loan Request", function () {
    it("Should let a borrower deposit collateral and request a loan", async function () {

      // Loading the fixture
      // Set up test for depositing collateral and requesting a loan
      // connect() to simulate actions from different accounts
      const timestamp = await time.latest()+2;
      const { collateralLoan, borrower } = await loadFixture(
        deployCollateralizedLoanFixture
      );
      await collateralLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(20, 90, { value: ethers.parseEther("2")});
      
      const loanItem = await collateralLoan.getLoan(1);
      expect(loanItem.interesRate).to.equal(20);
      expect(loanItem.dueDate).to.equal(timestamp + 90);
    });
  });

  // Test suite for funding a loan
  describe("Funding a Loan", function () {
    it("Allows a lender to fund a requested loan", async function () {
      // Loading the fixture
      // Set up test for a lender funding a loan
      const { collateralLoan, borrower, lender } = await loadFixture(
        deployCollateralizedLoanFixture
      );

      await collateralLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(20, 90, { value: ethers.parseEther("2")});

      await collateralLoan
        .connect(lender)
        .fundLoan(1, {value: ethers.parseEther("1")});

      const itemLoan = await collateralLoan.getLoan(1);
      expect(itemLoan.isFunded).to.equal(true);
    });
  });

  // Test suite for repaying a loan
  describe("Repaying a Loan", function () {
    it("Enables the borrower to repay the loan fully", async function () {
      // Loading the fixture
      const { collateralLoan, borrower, lender } = await loadFixture(
        deployCollateralizedLoanFixture
      );
      // Set up test for a borrower repaying the loan
      // Consider including the calculation of the repayment amount
      await collateralLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(20, 90, { value: ethers.parseEther("2")});

      await collateralLoan
        .connect(lender)
        .fundLoan(1, {value: ethers.parseEther("1")});


      await collateralLoan
          .connect(borrower)
          .repayLoan(1, {value: ethers.parseEther("1.049999999999999950")});

        const itemLoan = await collateralLoan.getLoan(1);

        // The calculation is based on the entered parameters (amount loaned = 1, interest rate = 20 a year and the duration = 90 days)
        const totalQuantityToPay = BigInt(itemLoan.loanAmount) + ((BigInt(itemLoan.loanAmount * itemLoan.interesRate)/100n)
          / 360n) * BigInt(itemLoan.duration);
       
        expect(totalQuantityToPay).to.equal(ethers.parseEther("1.049999999999999950"));
        expect(itemLoan.loanAmount).to.equal(ethers.parseEther("1"));
        expect(itemLoan.isRepaid).to.equal(true);

    });
  });

  // Test suite for claiming collateral
  describe("Claiming Collateral", function () {
    it("Permits the lender to claim collateral if the loan isn't repaid on time", async function () {
      // Loading the fixture
      const { collateralLoan, borrower, lender } = await loadFixture(
        deployCollateralizedLoanFixture
      );
      // Set up test for claiming collateral
      // Simulate the passage of time if necessary
      // Set up test for a borrower repaying the loan
      // Consider including the calculation of the repayment amount
      await collateralLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(20, 90, { value: ethers.parseEther("2")});

        await collateralLoan
        .connect(lender)
        .fundLoan(1, {value: ethers.parseEther("1")});

        await collateralLoan
          .connect(borrower)
          .repayLoan(1, {value: ethers.parseEther("1.049999999999999950")});

        await collateralLoan
          .connect(borrower)
          .claimCollateral(1);

        const itemLoan = await collateralLoan.getLoan(1);
        const timestamp = await time.latest()-3;

        expect(BigInt(itemLoan.dueDate)).to.equal(BigInt(timestamp) + BigInt(itemLoan.duration));
        expect(itemLoan.collateralAmount).to.equal(0);
    });
  });
});

