pragma solidity ^0.4.20;

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Track which addresses have voted
    mapping(address => bool) public voters;
    // Store voter numbers for validation
    mapping(address => uint) public voterNumbers;
    // Candidate storage
    mapping(uint => Candidate) public candidates;
    // Count of candidates
    uint public candidatesCount;

    event votedEvent(uint indexed _candidateId);

    // Legacy constructor syntax for 0.4.x
    function Election() public {
        addCandidate("Candidate A");
        addCandidate("Candidate B");
    }

    function addCandidate(string _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    // Register the voter's number (optional, call via Remix or other UI)
    function registerVoterNumber(uint _voterNumber) public {
        require(_voterNumber > 0);
        voterNumbers[msg.sender] = _voterNumber;
    }

    // Vote by providing candidate ID and the voter's number
    function vote(uint _candidateId, uint _voterNumber) public {
        // Ensure the voter hasn't voted before
        require(!voters[msg.sender]);
        // Ensure a valid candidate is selected
        require(_candidateId > 0 && _candidateId <= candidatesCount);
        // Validate that the provided voter number matches the registered one
        require(voterNumbers[msg.sender] == _voterNumber);

        // Record the vote
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        // Trigger the event
        votedEvent(_candidateId);
    }
}
