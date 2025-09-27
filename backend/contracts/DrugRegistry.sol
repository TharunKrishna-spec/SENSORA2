// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DrugRegistry {
    struct Drug {
        string drugName;
        string composition;
        string dosage;
        string batchNo;
        string expiryDate;
        bool exists;
    }

    struct HistoryEntry {
        string location;
        string timestamp;
        address actor;
    }

    mapping(string => Drug) private drugs;
    mapping(string => HistoryEntry[]) private histories;

    // Manufacturer control + replay protection
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => uint256) public nonces;
    address public admin;

    event DrugRegistered(
        string drugId,
        string drugName,
        string dosage,
        string expiryDate
    );
    event LocationUpdated(
        string drugId,
        string location,
        string timestamp,
        address actor
    );
    event ManufacturerAuthorized(address manufacturer);
    event ManufacturerRevoked(address manufacturer);

    constructor() {
        admin = msg.sender;
        authorizedManufacturers[msg.sender] = true; // deployer is admin & default authorized
    }

    // ----------------- Admin / Manufacturer management -----------------
    function authorizeManufacturer(address manufacturer) public {
        require(msg.sender == admin, "Only admin can authorize");
        authorizedManufacturers[manufacturer] = true;
        emit ManufacturerAuthorized(manufacturer);
    }

    function revokeManufacturer(address manufacturer) public {
        require(msg.sender == admin, "Only admin can revoke");
        authorizedManufacturers[manufacturer] = false;
        emit ManufacturerRevoked(manufacturer);
    }

    // ----------------- Basic register (manufacturer calls tx) -----------------
    // Kept for convenience: register directly from authorized address
    function registerBatch(
        string memory drugId,
        string memory drugName,
        string memory composition,
        string memory dosage,
        string memory batchNo,
        string memory expiryDate
    ) public {
        require(
            authorizedManufacturers[msg.sender],
            "Not an authorized manufacturer"
        );
        require(!drugs[drugId].exists, "Drug already registered");

        drugs[drugId] = Drug(
            drugName,
            composition,
            dosage,
            batchNo,
            expiryDate,
            true
        );
        emit DrugRegistered(drugId, drugName, dosage, expiryDate);
    }

    // ----------------- Signature based registration (any relayer can submit) -----------------
    // Helper to prefix message (EIP-191 / eth_sign)
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    // split signature helper
    function _splitSignature(
        bytes memory sig
    ) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) {
            v += 27;
        }
    }

    // Register using manufacturer's signature (prevents need to expose manufacturer private key on-chain)
    function registerBatchWithSig(
        string memory drugId,
        string memory drugName,
        string memory composition,
        string memory dosage,
        string memory batchNo,
        string memory expiryDate,
        address signer, // manufacturer address which signed the payload
        bytes memory signature // signature produced off-chain by signer
    ) public {
        require(authorizedManufacturers[signer], "Signer not authorized");
        require(!drugs[drugId].exists, "Drug already registered");

        // Build hash with nonce to prevent replay
        bytes32 hash = keccak256(
            abi.encodePacked(
                drugId,
                drugName,
                composition,
                dosage,
                batchNo,
                expiryDate,
                nonces[signer]
            )
        );
        bytes32 message = prefixed(hash);

        (uint8 v, bytes32 r, bytes32 s) = _splitSignature(signature);
        address recovered = ecrecover(message, v, r, s);
        require(recovered == signer, "Invalid signature");

        // signature valid => increment nonce and store drug
        nonces[signer] += 1;

        drugs[drugId] = Drug(
            drugName,
            composition,
            dosage,
            batchNo,
            expiryDate,
            true
        );
        emit DrugRegistered(drugId, drugName, dosage, expiryDate);
    }

    // ----------------- Update & read functions -----------------
    function updateLocation(
        string memory drugId,
        string memory location,
        string memory timestamp
    ) public {
        require(drugs[drugId].exists, "Drug not found");
        histories[drugId].push(HistoryEntry(location, timestamp, msg.sender));
        emit LocationUpdated(drugId, location, timestamp, msg.sender);
    }

    function getDetails(
        string memory drugId
    )
        public
        view
        returns (
            string memory drugName,
            string memory composition,
            string memory dosage,
            string memory batchNo,
            string memory expiryDate
        )
    {
        require(drugs[drugId].exists, "Drug not found");
        Drug memory d = drugs[drugId];
        return (d.drugName, d.composition, d.dosage, d.batchNo, d.expiryDate);
    }

    // Return history as parallel arrays so web3 can decode
    function getHistory(
        string memory drugId
    )
        public
        view
        returns (
            string[] memory locations,
            string[] memory timestamps,
            address[] memory actors
        )
    {
        uint len = histories[drugId].length;
        locations = new string[](len);
        timestamps = new string[](len);
        actors = new address[](len);

        for (uint i = 0; i < len; i++) {
            HistoryEntry memory h = histories[drugId][i];
            locations[i] = h.location;
            timestamps[i] = h.timestamp;
            actors[i] = h.actor;
        }
        return (locations, timestamps, actors);
    }
}
