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

    event DrugRegistered(string drugId, string drugName, string dosage, string expiryDate);
    event LocationUpdated(string drugId, string location, string timestamp, address actor);

    // ✅ Register drug
    function registerBatch(
        string memory drugId,
        string memory drugName,
        string memory composition,
        string memory dosage,
        string memory batchNo,
        string memory expiryDate
    ) public {
        require(!drugs[drugId].exists, "Drug already registered");

        drugs[drugId] = Drug(drugName, composition, dosage, batchNo, expiryDate, true);

        emit DrugRegistered(drugId, drugName, dosage, expiryDate);
    }

    // ✅ Update location
    function updateLocation(
        string memory drugId,
        string memory location,
        string memory timestamp
    ) public {
        require(drugs[drugId].exists, "Drug not found");

        histories[drugId].push(HistoryEntry(location, timestamp, msg.sender));

        emit LocationUpdated(drugId, location, timestamp, msg.sender);
    }

    // ✅ Get details of drug
    function getDetails(string memory drugId) public view returns (
        string memory drugName,
        string memory composition,
        string memory dosage,
        string memory batchNo,
        string memory expiryDate
    ) {
        require(drugs[drugId].exists, "Drug not found");
        Drug memory d = drugs[drugId];
        return (d.drugName, d.composition, d.dosage, d.batchNo, d.expiryDate);
    }

    // ❌ You can’t directly return array of structs in web3.js
    // ✅ Instead, split into separate arrays
    function getHistory(string memory drugId) public view returns (
        string[] memory locations,
        string[] memory timestamps,
        address[] memory actors
    ) {
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
