const CloneableWalletConf = require('./contracts/CloneableWallet.json');
const WalletFactoryConf = require('./contracts/WalletFactory.json');
const walletUtils = require('./wallet-utils.js');
const utils = require('./utils.js');

const init = web3 => {
  const CloneableWallet = new web3.eth.Contract(CloneableWalletConf.abi);
  const WalletFactory = new web3.eth.Contract(WalletFactoryConf.abi);

  /**
   * Create new wallet factory, configured to point to a CloneableWallet
   * returns address of wallet factory
   */
  const createWalletFactory = async ({ from }) => { 
    let tx;
    tx = await CloneableWallet
      .deploy({
        data: CloneableWalletConf.bytecode
      });
    const cloneableWallet = await utils.sendTx({web3, tx, from});

    tx = await WalletFactory
      .deploy({
        data: WalletFactoryConf.bytecode, 
        arguments: [cloneableWallet.options.address]
      });
    const walletFactory = await utils.sendTx({web3, tx, from});
    return walletFactory.options.address;
  }

  /**
   * Creates new wallet, using WalletFactory
   * returns address of new wallet
   */
  const createWallet = async ({
    from,
    recoveryAddress, 
    authorizedAddress, 
    cosignerAddress,
    walletFactoryAddress
  }) => { 
    const walletFactory = new web3.eth.Contract(
      WalletFactoryConf.abi, 
      walletFactoryAddress
    );
    //const receipt = await walletFactory.methods.deployCloneWallet(
    //  recoveryAddress,
    //  authorizedAddress,
    //  cosignerAddress
    //)
    //.send({ from, gas: 135500 });
    const tx = await walletFactory.methods.deployCloneWallet(
      recoveryAddress,
      authorizedAddress,
      cosignerAddress
    );
    const receipt = await utils.sendTx({web3, tx, from});
    return receipt.events.WalletCreated.returnValues.wallet;
  }

  /**
   * send Ether from a wallet
   */
  const sendEther = async ({sender, recipient, amount, walletAddress}) => {
    const wallet = new web3.eth.Contract(CloneableWalletConf.abi, walletAddress);
    await walletUtils.transact0(
      walletUtils.txData(0, recipient, amount, Buffer.from('')),
      wallet,
      sender
    );
    return;
  }

  /**
   * send ERC20 from a wallet
   */
  const sendERC20Token = async ({sender, recipient, amount, walletAddress, tokenAddress}) => {
    const wallet = new web3.eth.Contract(CloneableWalletConf.abi, walletAddress);
    const dataBuff = walletUtils.erc20Transfer(recipient, amount);
    await walletUtils.transact0(
      walletUtils.txData(0, tokenAddress, 0, dataBuff), 
      wallet,
      sender
    );
  }

  return {
    createWalletFactory,
    createWallet,
    sendEther,
    sendERC20Token
  };
}

module.exports = init;
