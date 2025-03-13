App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    $('#voteLink').hide();  // Hide the voting link initially
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof window.ethereum !== 'undefined') {
      App.web3Provider = window.ethereum;
      window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
    } else if (typeof window.web3 !== 'undefined') {
      App.web3Provider = window.web3.currentProvider;
      web3 = new Web3(window.web3.currentProvider);
    } else {
      // Fallback to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('build/contracts/Election.json', function(election) {
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();
      return App.render();
    });
  },

  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, { fromBlock: 0, toBlock: 'latest' })
      .watch(function(error, event) {
        console.log('Event triggered', event);
        App.render();
      });
    });
  },

  render: function() {
    let loader = $('#loader');
    let content = $('#content');
    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase((err, account) => {
      if (err === null) {
        App.account = account;
        $('#accountAddress').html('Your Account: ' + account);
      }
    });

    loader.hide();
    content.show();
  },

  // New function to check voter number from the backend
  checkVoterNumber: function() {
    let voterNumber = $('#voterNumberRegister').val();
    if (!voterNumber || voterNumber <= 0) {
      alert('Please enter a valid voter number.');
      return;
    }

    // Check with backend if number exists in JSON
    fetch('http://localhost:5000/api/auth/checkNumber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ number: voterNumber })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Number not found');
      }
      return response.json();
    })
    .then(data => {
      if (data.name) {
        // If number exists, display name and allow registration
        $('#voterStatus').html(`<span class="text-success">You can vote! Your name is ${data.name}.</span>`);
        App.registerVoterNumber();  // Proceed with blockchain registration
      } else {
        // If number does not exist, show an error
        $('#voterStatus').html(`<span class="text-danger">Sorry, you can't vote. Your number is not in the database.</span>`);
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error checking number. Check console for details.');
    });
  },

  registerVoterNumber: function() {
    let voterNumber = $('#voterNumberRegister').val();
    if (!voterNumber || voterNumber <= 0) {
      alert('Please enter a valid voter number.');
      return;
    }

    App.contracts.Election.deployed().then(function(instance) {
      return instance.registerVoterNumber(voterNumber, { from: App.account });
    }).then(function(result) {
      alert('Voter number registered successfully!');
      $('#voteLink').show();  // Show the voting link after successful registration
    }).catch(function(err) {
      console.error(err);
      alert('Error registering voter number. Check console for details.');
    });
  },

  castVote: function() {
    let voterNumber = $('#voterNumber').val();
    let candidateId = $('input[name="candidateRadio"]:checked').val();

    if (!voterNumber || voterNumber <= 0) {
      alert('Please enter a valid voter number.');
      return;
    }

    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, voterNumber, { from: App.account });
    }).then(function(result) {
      $('#content').hide();
      $('#loader').show();
    }).catch(function(err) {
      console.error(err);
      alert('Error processing your vote. Check console for details.');
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
