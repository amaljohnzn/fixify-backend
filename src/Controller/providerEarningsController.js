const asyncHandler = require("express-async-handler");
const ProviderEarnings = require("../Models/providerEarnings");

// Get provider earnings 

const getProviderEarnings = asyncHandler(async (req, res) => {
    const providerId = req.user.id;

    const earnings = await ProviderEarnings.find({ provider: providerId });

    let totalEarnings = 0;
    let balance = 0;
    let earningsPerService = {};

    earnings.forEach((entry) => {
        totalEarnings += entry.providerEarnings;
        balance += entry.balance;
        if (earningsPerService[entry.serviceName]) {
            earningsPerService[entry.serviceName] += entry.providerEarnings;
        } else {
            earningsPerService[entry.serviceName] = entry.providerEarnings;
        }
    });

    const formattedEarningsPerService = Object.keys(earningsPerService).map(service => ({
        serviceName: service,
        earnings: earningsPerService[service]
    }));

    res.json({
        totalEarnings,
        balance,
        earningsPerService: formattedEarningsPerService
    });
});

// Withdraw provider earnings 
const withdrawEarnings = asyncHandler(async (req, res) => {
    const providerId = req.user.id;
    const { amount } = req.body;

    const earnings = await ProviderEarnings.find({ provider: providerId });

    let totalBalance = earnings.reduce((sum, entry) => sum + entry.balance, 0);

    if (amount > totalBalance) {
        res.status(400);
        throw new Error("Insufficient balance to withdraw");
    }

    let remainingAmount = amount;

    for (let entry of earnings) {
        if (remainingAmount <= 0) break;
        if (entry.balance > 0) {
            const deduct = Math.min(entry.balance, remainingAmount);
            entry.balance -= deduct;
            remainingAmount -= deduct;
            await entry.save();
        }
    }

    res.json({
        message: "Withdrawal successful",
        withdrawnAmount: amount,
        remainingBalance: totalBalance - amount
    });
});

module.exports = { getProviderEarnings, withdrawEarnings };
