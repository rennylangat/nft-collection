import { Contract, provider, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  
  const [walletConnected, setWalletConnected] = useState(false);
  
  const [presaleStarted, setPresaleStarted] = useState(false);
  
  const [presaleEnded, setPresaleEnded] = useState(false);
  
  const [loading, setLoading] = useState(false);
  
  const [isOwner, setIsOwner] = useState(false);
  
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  
  const Web3ModalRef = useRef();

  /**
   * presaleMint: Mint an NFT during the presale
   */

  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const tx = await whitelistContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);

      await tx.wait();

      setLoading(false);

      window.alert("You successfully minted a Crypto Dev!");
    } catch (e) {
      console.error("Presale Mint", e);
    }
  };

  /**
   * publicMint: Mint an NFT after the presale
   */

  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const tx = await whitelistContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);

      await tx.wait();

      setLoading(false);

      window.alert("You successfully minted a Crypto Dev!");
    } catch (e) {
      console.error("Public Mint", e);
    }
  };

  /**
   * connectWallet: Connects the MetaMask wallet
   */

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (e) {
      console.error("Public Mint", e);
    }
  };

  /**
   * startPresale: starts the presale for the NFT collection
   */

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const tx = await whitelistContract.startPresale();

      setLoading(true);

      await tx.wait();

      setLoading(false);

      await checkIfPresaleStarted();
    } catch (e) {
      console.error("Start Presale", e);
    }
  };

  /**
   * checkIfPresaleStarted: checks if the presale has started by querying the presaleStarted variable in the Contract
   */

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (e) {
      console.error("check If Presale Started", e);
      return false;
    }
  };

  /**
   * checkIfPresaleEnded: checks if the presale has ended by querying the presaleEnded variable in the Contract
   */

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _presaleEnded = await nftContract.presaleEnded();

      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));

      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (e) {
      console.error("Check if Presale Ended", e);
      return false;
    }
  };

  /**
   * getOwner: gets the owner of the contract
   */

  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the owner function from the contract
      const _owner = await nftContract.owner();
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error("Get Owner", err.message);
    }
  };

  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
   
      const provider = await getProviderOrSigner();
   
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
   
      const _tokenIds = await nftContract.tokenIds();
   
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error("Get Token Ids Minted", err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */

  const getProviderOrSigner=async (needSigner=false)=>{
    const provider=await Web3ModalRef.current.connect();

    const web3Provider=new providers.Web3Provider(provider);

    const {chainId}=await web3Provider.getNetwork();

    if(chainId !==4){
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if(needSigner){
      const signer=web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  useEffect(()=>{
    if(!walletConnected){
      Web3ModalRef.current=new Web3Modal({
        network:"rinkeby",
        providerOptions:{},
        disableInjectedProvider:false
      });
      connectWallet();

      const _presaleStarted=checkIfPresaleStarted();
      if(_presaleStarted){
        checkIfPresaleEnded();
      }
      getTokenIdsMinted();

      const presaleEndedInterval=setInterval(async function (){
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded=await checkIfPresaleEnded();
          if(_presaleEnded){
            clearInterval(presaleEndedInterval);
          }
        }
      },5*1000);

      setInterval(async function(){
        await getTokenIdsMinted();

      },5 * 1000);
    }
  },[walletConnected]);

  const renderButton = () =>{
    if(!walletConnected){
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet
        </button>
      );
    }
    if(loading){
      return <button className={styles.button}>Loading...</button>
    }

    if(isOwner && !presaleStarted){
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    if(!presaleStarted){
      return (
        <div>
          <div className={styles.description}>Preale hasn't started!</div>
        </div>
      )
    }

    if(presaleStarted && !presaleEnded){
      return (
        <div>
          <div className={styles.description}>
            Presale has started!! If your address is whitlisted, Mint a Crypt Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if(presaleStarted && presaleEnded){
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>

      )
    }
  }
  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}