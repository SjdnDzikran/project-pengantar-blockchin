import { BrowserProvider, Contract } from 'ethers';
import contractABI from '../contracts/CompanyReviewLedger.abi.json';

const CONTRACT_ADDRESS = '0x3f9c46CF69c93B39c6D7e21723b465514Dd66758';
const DCHAIN_CHAIN_ID = 17845;

/**
 * Submit review directly to blockchain from user's wallet
 */
export async function submitReviewToBlockchain(reviewData) {
    const { reviewId, companyId, reviewerHash, reviewHash, rating, employmentProof } = reviewData;

    try {
        if (!window.ethereum) {
            throw new Error('No wallet found. Please install MetaMask.');
        }

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Check if on correct network
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== DCHAIN_CHAIN_ID) {
            throw new Error(`Please switch to DChain network (Chain ID: ${DCHAIN_CHAIN_ID})`);
        }

        // Create contract instance
        const contract = new Contract(CONTRACT_ADDRESS, contractABI, signer);

        // Estimate gas
        const gasEstimate = await contract.storeReview.estimateGas(
            reviewId,
            companyId,
            reviewerHash,
            reviewHash,
            rating,
            employmentProof
        );

        // Send transaction
        const tx = await contract.storeReview(
            reviewId,
            companyId,
            reviewerHash,
            reviewHash,
            rating,
            employmentProof,
            {
                gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
            }
        );

        console.log('Transaction sent:', tx.hash);
        console.log('Waiting for confirmation...');

        // Wait for confirmation
        const receipt = await tx.wait();

        console.log('Transaction confirmed:', receipt.hash);

        return {
            transactionHash: receipt.hash,
            blockNumber: Number(receipt.blockNumber),
            gasUsed: Number(receipt.gasUsed),
        };
    } catch (error) {
        console.error('Blockchain transaction error:', error);
        
        // Provide user-friendly error messages
        if (error.code === 'ACTION_REJECTED') {
            throw new Error('Transaction was rejected by user');
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            throw new Error('Insufficient funds to pay for gas fees');
        } else if (error.message.includes('Chain ID')) {
            throw error;
        } else {
            throw new Error(error.message || 'Failed to submit review to blockchain');
        }
    }
}

/**
 * Get review from blockchain
 */
export async function getReviewFromBlockchain(reviewId) {
    try {
        if (!window.ethereum) {
            throw new Error('No wallet found');
        }

        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(CONTRACT_ADDRESS, contractABI, provider);

        const review = await contract.getReview(reviewId);
        
        return {
            companyId: review.companyId,
            reviewerHash: review.reviewerHash,
            reviewHash: review.reviewHash,
            rating: Number(review.rating),
            employmentProof: review.employmentProof,
            timestamp: Number(review.timestamp),
        };
    } catch (error) {
        console.error('Failed to fetch review from blockchain:', error);
        throw error;
    }
}
