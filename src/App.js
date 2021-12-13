import React, { useEffect, useState } from "react";
import Store from '../src/Store.js';
import Blockchain from '../src/Blockchain.js';

function App() {
  const [paymentProcessor, setPaymentProcessor] = useState(undefined);
  const [duplas, setDuplas] = useState(undefined);
  const [nft, setNft] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const { paymentProcessor, duplas, nft } = await Blockchain();
      setPaymentProcessor(paymentProcessor);
      setDuplas(duplas);
      setNft(nft);
    }
    init();
  }, []);

  if (typeof window.ethereum === 'undefined') {
    return (
      <div className='container'>
        <h1>Blockchain App</h1>
        <p>You need to install the latest version of Metamask</p>
      </div>
    );
  }

  if (typeof paymentProcessor != 'undefined') {
    return (
      <div className='app-container'>
        <Store paymentProcessor={paymentProcessor} duplas={duplas} nft={nft} />
      </div>
    )
  } else {
    return (
      <div className='app-container'>
        <h1>Use Binance Smart Chain and Refresh this page!
        </h1>
      </div>
    )
  }

}
export default App;