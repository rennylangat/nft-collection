const {ethers}=require("hardhat");

require("dotenv").config({path: ".env"});

const {WHITELIST_CONTRACT_ADDRESS,METADATA_URL}=require("../constants");

async function main(){
    const whitelistContract=WHITELIST_CONTRACT_ADDRESS;
    const metaDataURL=METADATA_URL;

    const cryptoDevsContract=await ethers.getContractFactory("CryptoDevs");

    const deployedCryptoDevsContract=await cryptoDevsContract.deploy(
        metaDataURL,
        whitelistContract
    );

    console.log(
        "Crypto Devs Contract Address:",
        deployedCryptoDevsContract.address
    );




}

main().then(()=>process.exit(0))
.catch(error=>{
    console.log(error);process.exit(1)
});