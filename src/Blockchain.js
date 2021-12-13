import { ethers, Contract } from 'ethers';
import PaymentProcessor from './build/contracts/PaymentProcessor.json';
import Duplas from './build/contracts/StadiumErc20.json';
import Nft from './build/contracts/nftWithRoyalties.json';

const Blockchain = () =>

    new Promise((resolve, reject) => {
        window.addEventListener('load', async () => {
            ///.....
            ///.....
            // Check if MetaMask is installed
            // MetaMask injects the global API into window.ethereum
            if (window.ethereum) {
                try {
                    // check if the chain to connect to is installed
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x38' }], // chainId must be in hexadecimal numbers
                    });

                    await window.ethereum.enable();
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();

                    //Os contracts eles são "Binance Smart Chain"
                    const paymentProcessor = new Contract(
                        PaymentProcessor.networks[window.ethereum.networkVersion].address,
                        PaymentProcessor.abi,
                        signer
                    );

                    const duplas = new Contract(
                        '0xfA2258704a201C6C3D07c32f29d3059c56da58D4',
                        Duplas,
                        signer
                    );

                    const nft = new Contract(
                        Nft.networks[window.ethereum.networkVersion].address,
                        Nft.abi,
                        signer
                    );

                    resolve({ provider, paymentProcessor, duplas, nft });

                } catch (error) {
                    // This error code indicates that the chain has not been added to MetaMask
                    // if it is not, then install it into the user MetaMask
                    if (error.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: '0x38',
                                        rpcUrl: 'https://bsc-dataseed.binance.org/',
                                    },
                                ],
                            });
                        } catch (addError) {
                            console.error(addError);
                        }
                    }
                    console.error(error);
                }//FIM CATCH
            } else {
                // if no window.ethereum then MetaMask is not installed
                alert('MetaMask is not installed. Please consider installing it: https://metamask.io/download.html');
            }
            resolve({ provider: undefined, paymentProcessor: undefined, duplas: undefined, nft: undefined });
            ///.....
            ///.....

        });
    });

export default Blockchain;
