//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC2981PerTokenRoyalties.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract nftWithRoyalties is
    ERC721URIStorage,
    Ownable,
    ERC721Enumerable,
    ERC2981PerTokenRoyalties,
    AccessControl
{
    using Strings for uint256;
    using Counters for Counters.Counter;
    //Supplies
    uint256 public maxSupply = 10000;
    uint256 public vipSupply = 500;
    uint256 public premiumSupply = 1500;
    uint256 public category1Supply = 3000;
    uint256 public category2Supply = 5000;
    //Costs for Dapp (payment)
    uint256 public vipCost = 500 ether;
    uint256 public premiumCost = 200 ether;
    uint256 public category1Cost = 150 ether;
    uint256 public category2Cost = 100 ether;
    string public baseURI =
        "ipfs://QmfVdPbB2fe6oJHomHJ5TAECBfVmjvwd9t5bHvoHeJGozc/";
    string public baseExtension = ".json";
    //Royaltie Variables
    address public royaltyRecipient;
    uint256 public royaltyValue = 10000; // => 10%
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC721("Stadium", "STD") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function setRole(address _account) external {
        _setupRole(MINTER_ROLE, _account);
    }

    /// @inheritdoc	ERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981Base, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    mapping(uint256 => string) tokenURIs;

    /// @notice Mint one token to `caller`
    /// @param caller the recipient of the token
    function redeem(
        address caller,
        uint256 _mintAmount,
        uint256[] memory mytokenURI,
        uint256 _vipAmount,
        uint256 _premiumAmount,
        uint256 _category1Amount,
        uint256 _category2Amount,
        bytes calldata signature
    ) external {
        require(
            _verify(_hash(caller, mytokenURI[0]), signature),
            "Invalid signature"
        );
        uint256 supply = totalSupply();
        vipSupply = vipSupply - _vipAmount;
        premiumSupply = premiumSupply - _premiumAmount;
        category1Supply = category1Supply - _category1Amount;
        category2Supply = category2Supply - _category2Amount;

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(caller, (supply + i), "");
            _setTokenURI((supply + i), mytokenURI[i - 1].toString());
            tokenURIs[supply + i] = mytokenURI[i - 1].toString();
            if (royaltyValue > 0) {
                _setTokenRoyalty((supply + i), royaltyRecipient, royaltyValue);
            }
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenURIs[tokenId],
                        baseExtension
                    )
                )
                : "";
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setRoyaltyRecipient(address _newRoyaltyRecipient)
        public
        onlyOwner
    {
        royaltyRecipient = _newRoyaltyRecipient;
    }

    function setRoyaltyValue(uint256 _newRoyaltyValue) public onlyOwner {
        royaltyValue = _newRoyaltyValue;
    }

    function setVipCost(uint256 _newVipCost) public onlyOwner {
        vipCost = _newVipCost;
    }

    function setPremiumCost(uint256 _newPremiumCost) public onlyOwner {
        premiumCost = _newPremiumCost;
    }

    function setCategory1Cost(uint256 _newCategory1Cost) public onlyOwner {
        category1Cost = _newCategory1Cost;
    }

    function setCategory2Cost(uint256 _newCategory2Cost) public onlyOwner {
        category2Cost = _newCategory2Cost;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    // FUNCTIONS are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
        onlyOwner
    {
        super._burn(tokenId);
    }

    function _hash(address account, uint256 tokenId)
        internal
        pure
        returns (bytes32)
    {
        return
            ECDSA.toEthSignedMessageHash(
                keccak256(abi.encodePacked(tokenId, account))
            );
    }

    function _verify(bytes32 digest, bytes memory signature)
        internal
        view
        returns (bool)
    {
        return hasRole(MINTER_ROLE, ECDSA.recover(digest, signature));
    }
}
