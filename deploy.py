from web3 import Web3
import json
from getpass import getpass

HTTP_PROVIDER = "http://localhost:8545"

DEPLOYER_ADDRESS = "0xd9232DB885e7db72eb0e55c25622e7C9413c4350"
KEY_UTC_FILE = 'data/keystore/UTC--2025-10-20T03-50-24.444331003Z--d9232db885e7db72eb0e55c25622e7c9413c4350'


# Connect to blockchain
w3 = Web3(Web3.HTTPProvider(HTTP_PROVIDER))
assert w3.is_connected(), "Web3 Connect Fail"

with open(KEY_UTC_FILE) as keyfile:
    key_data = keyfile.read()
    pwd = getpass("Account Password:")
    private_key = w3.eth.account.decrypt(key_data, pwd)

# Prepare Contract Deployment Transaction
# Load ABI & bytecode
with open("build/CompanyReviewLedger.abi", "r") as f:
    contract_abi = json.load(f)
with open("build/CompanyReviewLedger.bin", "r") as f:
    contract_bytecode = f.read().strip()

CompanyReviewLedger = w3.eth.contract(abi=contract_abi, bytecode=contract_bytecode)
nonce = w3.eth.get_transaction_count(DEPLOYER_ADDRESS)

transaction = CompanyReviewLedger.constructor().build_transaction({
    "chainId": 110261,
    "from": DEPLOYER_ADDRESS,
    "nonce": nonce,
    "gas": 3000000,
    "gasPrice": w3.eth.gas_price
})

signed_txn = w3.eth.account.sign_transaction(transaction, private_key=private_key)
tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

print("Deployment transaction sent. TX hash:", tx_hash.hex())

tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Contract deployed at address:", tx_receipt.contractAddress)