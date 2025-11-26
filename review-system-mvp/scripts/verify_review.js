#!/usr/bin/env node
/**
 * Simple review verification script (Node.js version)
 * Fetches and displays a review from the blockchain
 */

const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

async function verifyReview(reviewId) {
    try {
        // Connect to blockchain
        const web3 = new Web3('http://127.0.0.1:8545');

        const connected = await web3.eth.net.isListening();
        if (!connected) {
            console.log('✗ Cannot connect to blockchain at http://127.0.0.1:8545');
            console.log('  Make sure the blockchain node is running');
            return false;
        }

        const blockNumber = await web3.eth.getBlockNumber();
        console.log(`✓ Connected to blockchain (Block: ${blockNumber})`);

        // Load contract ABI
        const abiPath = path.join(__dirname, '../blockchain/build/CompanyReviewLedger.abi');
        if (!fs.existsSync(abiPath)) {
            console.log('✗ Contract ABI not found');
            console.log('  Make sure the contract is compiled and deployed');
            return false;
        }

        const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

        // Load contract address
        const contractAddress = process.env.CONTRACT_ADDRESS || '0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA';
        const contract = new web3.eth.Contract(abi, contractAddress);

        console.log(`✓ Contract loaded at: ${contractAddress}`);
        console.log();

        // Check if review exists
        const exists = await contract.methods.reviewExists(reviewId).call();
        if (!exists) {
            console.log(`✗ Review '${reviewId}' not found on blockchain`);
            return false;
        }

        // Get review
        const review = await contract.methods.getReview(reviewId).call();

        // Parse review data
        const companyId = review.companyId;
        const reviewerHash = review.reviewerHash;
        const reviewHash = review.reviewHash;
        const rating = Number(review.rating);
        const employmentProof = review.employmentProof;
        const timestamp = Number(review.timestamp);

        // Display review
        console.log('='.repeat(70));
        console.log('REVIEW DATA FROM BLOCKCHAIN');
        console.log('='.repeat(70));
        console.log();
        console.log(`Review ID:        ${reviewId}`);
        console.log(`Company Hash:     ${companyId}`);
        console.log(`Reviewer Hash:    ${reviewerHash}`);
        console.log(`Review Hash:      ${reviewHash}`);
        console.log(`Rating:           ${rating} / 5`);
        console.log(`Employment Proof: ${employmentProof}`);
        console.log(`Timestamp:        ${timestamp}`);
        console.log(`Date:             ${new Date(timestamp * 1000).toLocaleString()}`);
        console.log();
        console.log('='.repeat(70));
        console.log();

        return true;
    } catch (error) {
        console.error('✗ Error:', error.message);
        return false;
    }
}

// Main
if (require.main === module) {
    if (process.argv.length < 3) {
        console.log('Usage: node verify_review.js <REVIEW_ID>');
        console.log();
        console.log('Example:');
        console.log('  node verify_review.js REVMI5BI1E3UI1KM');
        process.exit(1);
    }

    const reviewId = process.argv[2];

    verifyReview(reviewId)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { verifyReview };
