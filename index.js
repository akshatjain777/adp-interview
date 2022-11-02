const axios = require('axios');

const ADP_API = 'https://interview.adpeai.com/api/v2';

const callAPI = async (method, url, data) => {
  // Headers initialization
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
  try {
    // Function will check for GET and POST method and call API accordingly
    let response;
    if (method === 'GET') {
      response = await axios.get(url, headers);
    } else {
      response = await axios.post(url, data, headers);
    }
    if (response?.data) {
      // Returning response
      return response.data;
    }
    return null;
  } catch (error) {
    console.log(error?.message || '');
    // Returning null to handle the error by IIFE function
    return null;
  }
};

const getLastYearsTopEarner = (transactions) => {
  try {
    const employeesData = {};
    let topEarner = '';
    let topEarning = 0;
    // Mapping through transactions
    transactions.map((transactionEl) => {
      const lastYear = new Date().getUTCFullYear() - 1;
      const transactionYear = new Date(
        transactionEl.timeStamp
      ).getUTCFullYear();

      if (transactionYear === lastYear) {
        // validating transaction date is equal to last year's date
        // Initializing variables
        const employeeId = transactionEl?.employee?.id;
        const transactionAmount = +transactionEl.amount || 0;
        const transactionId = transactionEl.transactionID;
        const transactionType = transactionEl.type === 'alpha';

        if (employeesData[employeeId]) {
          // If Employee already exists, update earning and transactionIds
          const employeeEarnings = employeesData[employeeId].earnings;

          if (transactionType) {
            // Only store transactionId if transactionType is "alpha"
            employeesData[employeeId].transactionIds.push(transactionId);
          }
          // Updating earning of an employee
          employeesData[employeeId].earnings =
            employeeEarnings + transactionAmount;

          if (employeeEarnings + transactionAmount > topEarning) {
            // If earning is higher than top earnings, then update the earnings and employeeId
            topEarner = employeeId;
            topEarning = employeeEarnings + transactionAmount;
          }
        } else {
          // If function is ran for the first time for an employee
          // Create an object with employee ID as key and transactionIds, earnings as values
          employeesData[employeeId] = {
            transactionIds: transactionType ? [transactionId] : [],
            earnings: transactionAmount,
          };
          if (transactionAmount > topEarning) {
            // If employee earning for first transaction is higer than topEarning, then update the earnings and employeeId
            topEarner = employeeId;
            topEarning = transactionAmount;
          }
        }
      }
    });
    // Returning total only alpha transactions of top earning employee for previous year
    return employeesData[topEarner]?.transactionIds || null;
  } catch (error) {
    // Logging error message if available
    console.log(error?.message || '');
    // Returning null to handle the error by IIFE function
    return null;
  }
};

// IIFE function to run function on npm-start
(async () => {
  // Fetching transactions from ADP API
  console.log(
    `======================== Fetching transactions from ADP API (GET) ========================`
  );
  const transactions = await callAPI('GET', `${ADP_API}/get-task`);
  if (!transactions) {
    // If any error while fetching transaction, log and exit out of function
    console.log('Something went wrong while fetching transactions!');
    return;
  }
  // Filtering top earner's transactions
  console.log(
    `========================= Filtering Transactions for top earners =========================`
  );
  const topEarnerTransactions = getLastYearsTopEarner(
    transactions.transactions
  );
  if (!topEarnerTransactions) {
    // If any error while filtering transaction, log the error and exit out of function
    console.log(`Something went wrong filtering top earner's transactions!`);
    return;
  }
  // Submitting result to ADP API
  const submitResults = await callAPI('POST', `${ADP_API}/submit-task`, {
    id: transactions.id,
    result: topEarnerTransactions,
  });
  if (!submitResults) {
    // If any error while submitting result, log the error and exit out of function
    console.log('Something went wrong while submitting results!');
    return;
  }
  // Logging ADP Response
  console.log(
    `====================== ADP Submission Response Data (POST): ${submitResults} ======================`
  );
})();
