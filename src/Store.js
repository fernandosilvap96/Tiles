import React from 'react';
import { useState } from 'react';
import { ethers } from 'ethers';

//1 => [] DEPLOY MAINNET "PaymentProcessor"
//2 => [] DEPLOY MAINNET "nftWithRoyalties"
//3 => [] DAPP (batafrita) => LINK NFT (uri? pinata?)

function Store({ paymentProcessor, duplas, nft }) {

    const [vipAmount, setVipAmount] = useState("0");
    const [premiumAmount, setPremiumAmount] = useState("0");
    const [category1Amount, setCategory1Amount] = useState("0");
    const [category2Amount, setCategory2Amount] = useState("0");

    function hashToken(account, tokenId) {
        return Buffer.from(ethers.utils.solidityKeccak256(['uint256', 'address'], [tokenId, account]).slice(2), 'hex')
    }

    // 100 + 18zeros
    // 625
    // 1000
    // 1000 + 18zeros

    const buy = async () => {

        if (window.ethereum) {
            //Provider
            await window.ethereum.enable();
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const account = address;

            //Inicialização Uris e payed
            const arrURIs = [];
            let payed = false;

            console.log(nft);
            console.log(duplas);
            console.log('actived address: ' + address);

            //Consulta de preço de cada categoria
            const vipPrice = await nft.vipCost();
            const premiumPrice = await nft.premiumCost();
            const category1Price = await nft.category1Cost();
            const category2Price = await nft.category2Cost();

            //Consulta do supply de cada categoria
            const vipSupply = await nft.vipSupply();
            const premiumSupply = await nft.premiumSupply();
            const category1Supply = await nft.category1Supply();
            const category2Supply = await nft.category2Supply();

            //Subtotal por categoria
            const vipTotalAmount = parseInt(vipPrice) * parseInt(vipAmount);
            const premiumTotalAmount = parseInt(premiumPrice) * parseInt(premiumAmount);
            const category1TotalAmount = parseInt(category1Price) * parseInt(category1Amount);
            const category2TotalAmount = parseInt(category2Price) * parseInt(category2Amount);

            //Totais
            const totalAmountInt = vipTotalAmount + premiumTotalAmount + category1TotalAmount + category2TotalAmount;
            const totalAmountStr = totalAmountInt.toString();

            /******************************************************************************
             *                                   TRANSAÇÕES
             ******************************************************************************/

            if (totalAmountInt < 1000000000000000000000 && totalAmountInt > 0) {

                //TX Approve $STD
                try {
                    console.log("Executing Approve $STD...");
                    const tx1 = await duplas.approve("0x2616D8D69419fd41D1cA4175Ac3d280102420cEF", totalAmountStr);
                    await tx1.wait();
                    console.log("Approvement $STD DONE");
                } catch (error) {
                    console.log('That approvement did not go well.')
                }

                //TX Pagamento
                const paymentId = (Math.random() * 10000).toFixed(0);
                if ((vipSupply - vipAmount) >= 0 &&
                    (premiumSupply - premiumAmount) >= 0 &&
                    (category1Supply - category1Amount) >= 0 &&
                    (category2Supply - category2Amount) >= 0) {
                    try {
                        console.log("Executing Payment...");
                        const tx2 = await paymentProcessor.pay(totalAmountStr, paymentId);
                        await tx2.wait();
                        payed = true;
                        console.log("Payment $STD DONE");
                    } catch (error) {
                        console.log('That payment did not go well.')
                    }
                }

                //URIS VIP
                if (vipAmount > 0 && (vipSupply - vipAmount) >= 0) {
                    console.log('vipSupply: ' + vipSupply);
                    for (let i = vipSupply; i > (vipSupply - vipAmount); i--) {
                        arrURIs.push(i);
                    }
                }

                //URIS PREMIUM
                if (premiumAmount > 0 && (premiumSupply - premiumAmount) >= 0) {
                    console.log('premiumSupply: ' + premiumSupply);
                    for (let i = premiumSupply; i > (premiumSupply - premiumAmount); i--) {
                        arrURIs.push(i);
                    }
                }

                //URIS CATEGORY 1
                if (category1Amount > 0 && (category1Supply - category1Amount) >= 0) {
                    console.log('category1Supply: ' + category1Supply);
                    for (let i = category1Supply; i > (category1Supply - category1Amount); i--) {
                        arrURIs.push(i);
                    }
                }

                //URIS CATEGORY 2
                if (category2Amount > 0 && (category2Supply - category2Amount) >= 0) {
                    console.log('category2Supply: ' + category2Supply);
                    for (let i = category2Supply; i > (category2Supply - category2Amount); i--) {
                        arrURIs.push(i);
                    }
                }

                //TX Signature
                console.log("Executing Signature...");
                const signature = await signer.signMessage(hashToken(account, arrURIs[0]));
                console.log("Save Your Signature...");
                console.log(signature);


                //TX Set MINTER_ROLE
                try {
                    console.log("Executing Grant Role...");
                    const tx5 = await nft.setRole(address);
                    const result5 = await tx5.wait();
                    console.log(result5);
                    console.log("Now You have a Minter Role...");
                } catch (error) {
                    console.log('That Grant Role did not go well.' + error)
                }

                //TOKEN_ID, ACCOUNT = SIGNATURE

                //TX Redeem
                const cantidad = parseInt(vipAmount) + parseInt(premiumAmount) + parseInt(category1Amount) + parseInt(category2Amount);
                if (payed == true) {
                    console.log("Executing Redeeming...");
                    try {
                        const tx6 = await nft.redeem(
                            address, cantidad, arrURIs,
                            vipAmount, premiumAmount,
                            category1Amount, category2Amount, signature
                        );
                        const result6 = await tx6.wait();
                        console.log(result6);
                        console.log("Redeeming done...");
                        
                        //Listar as URIs do user
                        let i = 0
                        for (i = 0; i < arrURIs.length; i++) { 
                            const tokensBaseURI = await nft.baseURI();
                            console.log(tokensBaseURI + arrURIs[i]);
                        }


                    } catch (error) {
                        console.log('That minting did not go well.' + error)
                    }
                }

            } else {
                console.log("Total Amount Exceed Allowed or Invalid Mint Amount");
            }

        }
    }

    return (
        <div>
            <h1 className='title'>Stadium Minter</h1>
            <h3 className="sub-title">Informe a quantidade e categoria dos itens que deseja reservar:</h3>
            <div className='input-group'>
            <form>
                <h2>VIP</h2>
                <input
                    type="number"
                    max="10"
                    min="0"
                    onChange={(event) => setVipAmount(event.target.value)}
                />
                <h2>PREMIUM</h2>
                <input
                    type="number"
                    max="10"
                    min="0"
                    onChange={(event) => setPremiumAmount(event.target.value)}
                />
                <h2>CATEGORY 1</h2>
                <input
                    type="number"
                    max="10"
                    min="0"
                    onChange={(event) => setCategory1Amount(event.target.value)}
                />
                <h2>CATEGORY 2</h2>
                <input
                    type="number"
                    max="10"
                    min="0"
                    onChange={(event) => setCategory2Amount(event.target.value)}
                />
                <button
                    type='button'
                    className='btn'
                    onClick={() => buy()}
                >
                    RESERVE
                </button>
            </form>
            </div>
            <hr />
        </div>

    );
}

export default Store;