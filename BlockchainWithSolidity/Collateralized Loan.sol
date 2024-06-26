// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Collateralized Loan Contract
contract CollateralizedLoan {
    // Define the structure of a loan
    struct Loan {
        uint id;
        address payable borrower;
        address payable lender;
        uint collateralAmount;
        uint loanAmount;
        uint interesRate;
        uint duration;
        uint dueDate;
        bool isFunded;
        bool isRepaid;
    }

    // Create a mapping to manage the loans
    mapping(uint => Loan) public loans;

    // Lender address
    address public lender;

    // Owner address
    address public owner;

    // Loan ID
    uint public nextLoanId;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action.");
        _;
    }

    // Define events for loan requested, funded, repaid, and collateral claimed
    event LoanCreated(uint indexed loanId, address indexed borrower, uint interestRate, uint dueDate);

    event LoanFunded(uint indexed loanId, address indexed lender, bool isFunded);

    event LoanRepaid(uint indexed loanId, address indexed borrower, uint amountRepaid, bool isRepaid);
    
    event ClaimCollateral(uint indexed loanId, address indexed borrower);
    
    // Function to deposit collateral and request a loan
    function depositCollateralAndRequestLoan(uint _interestRate, uint _duration) external payable {
        // Check if the collateral is more than 0
        require(msg.value > 0, "The collateral amount must be more than 0."); 
        // Calculate the loan amount based on the collateralized amount
        // Increment nextLoanId and create a new loan in the loans mapping
        nextLoanId++;
        loans[nextLoanId] = Loan({
            id: nextLoanId,
            borrower: payable(msg.sender),
            lender: payable(lender),
            collateralAmount: msg.value,
            loanAmount: msg.value / 2,
            interesRate: _interestRate,
            duration: _duration,
            dueDate: block.timestamp + _duration,
            isFunded: false,
            isRepaid: false
        });
        emit LoanCreated(nextLoanId, msg.sender, _interestRate, loans[nextLoanId].dueDate);
    }

    // Function to fund a loan
    // Write the fundLoan function with necessary checks and logic
    function fundLoan(uint _loanId) external payable {
        Loan storage itemLoan = loans[_loanId];
        require(itemLoan.id > 0  && itemLoan.id <= nextLoanId, "The loan does not exist");
        require(!itemLoan.isFunded, "The loan has already been funded");
        require(msg.sender != itemLoan.borrower, "You can't fund your own loan");
        require(msg.value == itemLoan.loanAmount, "You must fund the expected loan amount");

        itemLoan.isFunded = true;
        itemLoan.borrower.transfer(msg.value);

        emit LoanFunded(_loanId, msg.sender, itemLoan.isFunded);
    }

    // Function to repay a loan
    function repayLoan(uint _loanId) external payable {
        Loan storage itemLoan = loans[_loanId];
        require(!itemLoan.isRepaid, "The loan has already been repaid");
        require(msg.sender == itemLoan.borrower, "Only the borrower can repay the loan");

        // The total amount to repay must be the total amount plus the correponding interest
        // depending on the duration of the loan
        uint totalAmountToRepay = itemLoan.loanAmount + ((itemLoan.loanAmount * 
            (itemLoan.interesRate / 100))) / 360 * itemLoan.duration;

        itemLoan.isRepaid = true;
        payable(msg.sender).transfer(totalAmountToRepay);

        emit LoanRepaid(_loanId, msg.sender, msg.value, itemLoan.isRepaid);
    }


    // Function to claim collateral on default
    function claimCollateral(uint _loanId) external {
        Loan storage itemLoan = loans[_loanId];
        require(itemLoan.isRepaid == true, "The loan has not yet been repaid");
        require(msg.sender == itemLoan.borrower, "Only the borrower can claim the loan");
        require(block.timestamp > itemLoan.duration, "The due date has not yet arrived");

        itemLoan.collateralAmount = 0;
        payable(msg.sender).transfer(itemLoan.collateralAmount);

        emit ClaimCollateral(_loanId, msg.sender);
    }

    // Function to get a specific loan by its Id
    function getLoan(uint _loanId) public view returns (Loan memory) {
        return loans[_loanId];
    }

    // Function to check the current number of loans
    function getLoanCount() public view returns (uint) {
        return nextLoanId;
    }

}