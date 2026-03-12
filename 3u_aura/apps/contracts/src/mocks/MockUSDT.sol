// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title MockUSDT
/// @notice Minimal ERC20 test token with controllable transfer failures.
contract MockUSDT {
    error InsufficientAllowance();
    error InsufficientBalance();
    error ZeroAddress();

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    string public constant name = "Mock USDT";
    string public constant symbol = "mUSDT";
    uint8 public constant decimals = 6;

    uint256 public totalSupply;
    bool public forceTransferFailure;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Enables or disables forced transfer failure.
    function setForceTransferFailure(bool shouldFail) external {
        forceTransferFailure = shouldFail;
    }

    /// @notice Mints test USDT to an address.
    function mint(address recipient, uint256 amount) external {
        if (recipient == address(0)) {
            revert ZeroAddress();
        }

        totalSupply += amount;
        balanceOf[recipient] += amount;
        emit Transfer(address(0), recipient, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (forceTransferFailure) {
            return false;
        }

        uint256 allowed = allowance[from][msg.sender];
        if (allowed < amount) {
            revert InsufficientAllowance();
        }

        allowance[from][msg.sender] = allowed - amount;
        emit Approval(from, msg.sender, allowance[from][msg.sender]);
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        if (forceTransferFailure) {
            return false;
        }
        if (to == address(0)) {
            revert ZeroAddress();
        }

        uint256 senderBalance = balanceOf[from];
        if (senderBalance < amount) {
            revert InsufficientBalance();
        }

        balanceOf[from] = senderBalance - amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
