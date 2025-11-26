const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class BlockchainService {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
            this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

            // Check connection
            const isConnected = await this.web3.eth.net.isListening();
            if (!isConnected) {
                throw new Error('Cannot connect to blockchain node');
            }

            const chainId = await this.web3.eth.getChainId();
            const blockNumber = await this.web3.eth.getBlockNumber();

            console.log('✓ Connected to blockchain');
            console.log(`  Chain ID: ${chainId}`);
            console.log(`  Block number: ${blockNumber}`);

            // Load contract ABI
            const abiPath = path.join(__dirname, '../../../blockchain/build/CompanyReviewLedger.abi');

            if (fs.existsSync(abiPath)) {
                const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
                const contractAddress = process.env.CONTRACT_ADDRESS;

                if (contractAddress && contractAddress !== '0xYourContractAddressHere') {
                    this.contract = new this.web3.eth.Contract(abi, contractAddress);
                    console.log(`✓ Smart contract loaded at: ${contractAddress}`);
                    this.initialized = true;
                } else {
                    console.warn('⚠ Contract address not configured. Please deploy contract first.');
                }
            } else {
                console.warn('⚠ Contract ABI not found. Please compile and deploy contract first.');
            }

            return true;
        } catch (error) {
            console.error('✗ Failed to initialize blockchain:', error.message);
            return false;
        }
    }

    async storeReview(reviewData) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        const { reviewId, companyId, reviewerHash, reviewHash, rating, employmentProof } = reviewData;

        try {
            const deployerAddress = process.env.DEPLOYER_ADDRESS;
            const deployerPassword = process.env.DEPLOYER_PASSWORD;

            // Unlock account
            await this.web3.eth.personal.unlockAccount(deployerAddress, deployerPassword, 300);

            // Send transaction
            const receipt = await this.contract.methods
                .storeReview(reviewId, companyId, reviewerHash, reviewHash, rating, employmentProof)
                .send({
                    from: deployerAddress,
                    gas: 500000
                });

            return {
                transactionHash: receipt.transactionHash,
                blockNumber: Number(receipt.blockNumber),
                gasUsed: Number(receipt.gasUsed)
            };
        } catch (error) {
            console.error('Error storing review on blockchain:', error);
            throw error;
        }
    }

    async getReview(reviewId) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const review = await this.contract.methods.getReview(reviewId).call();
            return {
                companyId: review.companyId,
                reviewerHash: review.reviewerHash,
                reviewHash: review.reviewHash,
                rating: Number(review.rating),
                employmentProof: review.employmentProof,
                timestamp: Number(review.timestamp)
            };
        } catch (error) {
            console.error('Error fetching review from blockchain:', error);
            throw error;
        }
    }

    async getReviewsByCompany(companyId) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const reviewIds = await this.contract.methods.getReviewsByCompanyId(companyId).call();
            return reviewIds;
        } catch (error) {
            console.error('Error fetching company reviews:', error);
            throw error;
        }
    }

    async verifyReviewHash(reviewId, reviewHash) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const isValid = await this.contract.methods.verifyReviewHash(reviewId, reviewHash).call();
            return isValid;
        } catch (error) {
            console.error('Error verifying review hash:', error);
            throw error;
        }
    }

    async getReviewCount() {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const count = await this.contract.methods.getReviewCount().call();
            return Number(count);
        } catch (error) {
            console.error('Error getting review count:', error);
            throw error;
        }
    }
}

// Export singleton instance
const blockchainService = new BlockchainService();
module.exports = blockchainService;
