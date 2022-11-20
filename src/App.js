import React, { useState, useEffect } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import { Buffer } from "buffer";
import kp from "./keypair.json";

window.Buffer = Buffer;

const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey("3DdKqVj9wA3q56crthydc4ccEi6EbHk6afmdsHPC8nhz");

const network = clusterApiUrl("devnet");

const opts = {
  preflightCommitment: "processed",
};

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
  "https://media.giphy.com/media/lTGLOH7ml3poQ6JoFg/giphy.gif",
  "https://media.giphy.com/media/e6TR9n00dL3JS/giphy.gif",
  "https://media.giphy.com/media/aCGdw5s3Tmxko6h7dP/giphy-downsized-large.gif",
  "https://media.giphy.com/media/26tP21xUQnOCIIoFi/giphy.gif",
];

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [toggleDarkModeOn, setToggleDarkModeOn] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const checkIfPhantomWalletIsConnected = async () => {
    if (window?.phantom?.solana?.isPhantom) {
      console.log("Phantom Wallet is found!");

      try {
        const response = await window.phantom.solana.connect();
        setWalletAddress(response.publicKey.toString());
        console.log("Connected with Public Key:", response.publicKey.toString());
      } catch (e) {
        console.log(e);
      }
    } else {
      alert("Solana object not found!");
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderSwitchDarkMode = () => (
    <button
      className={`dark-mode-button ${toggleDarkModeOn && "white-background black-text"}`}
      onClick={() => setToggleDarkModeOn((prev) => !prev)}
    >
      {`Dark Mode ${toggleDarkModeOn ? "On" : "Off"}`}
    </button>
  );

  const onInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment);

    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();

      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString());
      await getGifList();
    } catch (e) {
      console.log("Error creating BaseAccount account:", e);
    }
  };

  const getProgram = async () => {
    const idl = await Program.fetchIdl(programID, getProvider());

    return new Program(idl, programID, getProvider());
  };

  const getGifList = async () => {
    try {
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (e) {
      console.log("Error in getGifList: ", e);
      setGifList(null);
    }
  };

  const sendGif = async () => {
    if(inputValue.length === 0){
      console.log("No gif link given!");
      return;
    };
    setInputValue('');
    console.log("Gif link:", inputValue);
    try{
      const provider = getProvider();
      const program = await getProgram();

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue);

      await getGifList();
    }catch (e) {
      console.log("Error sending GIF:", e);
    }
  };

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For Gif Program Account
          </button>
        </div>
      );
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>

          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfPhantomWalletIsConnected();
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");

      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className={`App ${!toggleDarkModeOn && "white-background"}`}>
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className={`header ${!toggleDarkModeOn && "black-text"}`}>🖼 Beer Portal</p>
          <p className={`sub-text ${!toggleDarkModeOn && "black-text"}`}>
            View your Beer collection in the metaverse ✨
          </p>
          {renderSwitchDarkMode()}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className={`footer-text ${!toggleDarkModeOn && "black-text"}`}
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
