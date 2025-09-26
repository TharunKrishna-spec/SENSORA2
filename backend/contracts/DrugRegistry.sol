// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DrugRegistry {
    struct Event {
        string location;
        string timestamp;
        address actor;
    }

    struct Drug {
        string batchNo;
        string expiryDate;
        bool exists;
    }

    mapping(string => Drug) public drugs;
    mapping(string => Event[]) private history;

    event Registered(string drugId, string batchNo, string expiry);
    event Updated(string drugId, string location, string timestamp, address actor);

    // Manufacturer registers a drug batch
    function registerBatch(
        string memory drugId,
        string memory batchNo,
        string memory expiry
    ) public {
        require(!drugs[drugId].exists, "Drug already registered");
        drugs[drugId] = Drug(batchNo, expiry, true);
        emit Registered(drugId, batchNo, expiry);
    }

    // Update location when scanned
    function updateLocation(
        string memory drugId,
        string memory location,
        string memory timestamp
    ) public {
        require(drugs[drugId].exists, "Drug not found");
        history[drugId].push(Event(location, timestamp, msg.sender));
        emit Updated(drugId, location, timestamp, msg.sender);
    }

    // View history
    function getHistory(string memory drugId) public view returns (Event[] memory) {
        return history[drugId];
    }

    // Check expiry (compare strings outside for simplicity)
    function getExpiry(string memory drugId) public view returns (string memory) {
        require(drugs[drugId].exists, "Drug not found");
        return drugs[drugId].expiryDate;
    }
}
