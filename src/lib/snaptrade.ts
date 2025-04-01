import { Snaptrade } from "snaptrade-typescript-sdk";

export const snaptradeClient = new Snaptrade({
  clientId: process.env.NEXT_PUBLIC_SNAPTRADE_CLIENT_ID || "",
  consumerKey: process.env.NEXT_PUBLIC_SNAPTRADE_CONSUMER_KEY || "",
});

export async function getUserAccounts(userId: string, userSecret: string) {
  try {
    // Add debug logging
    console.log(
      `Fetching accounts for userId: ${userId} with userSecret length: ${userSecret?.length || 0}`,
    );

    if (!userId || !userSecret) {
      console.error("Missing required parameters for getUserAccounts");
      return { accounts: [] };
    }

    // Make the API call
    const result = await snaptradeClient.accountInformation.listUserAccounts({
      userId,
      userSecret,
    });

    console.log(
      `Successfully fetched ${result?.accounts?.length || 0} accounts`,
    );
    return result;
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return { accounts: [] };
  }
}

export async function getAccountDetails(
  accountId: string,
  userId: string,
  userSecret: string,
) {
  try {
    console.log(
      `Fetching account details for accountId: ${accountId}, userId: ${userId}`,
    );

    if (!accountId || !userId || !userSecret) {
      console.error("Missing required parameters for getAccountDetails");
      return null;
    }

    const details =
      await snaptradeClient.accountInformation.getUserAccountDetails({
        accountId,
        userId,
        userSecret,
      });

    const holdings = await snaptradeClient.accountInformation.getUserHoldings({
      accountId,
      userId,
      userSecret,
    });

    const balance =
      await snaptradeClient.accountInformation.getUserAccountBalance({
        accountId,
        userId,
        userSecret,
      });

    console.log(`Successfully fetched details for account ${accountId}`);
    return {
      ...details.data,
      holdings: holdings.data,
      balance: balance.data,
    };
  } catch (error) {
    console.error("Error fetching account details:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    // Return mock data instead of null to prevent UI errors
    return {
      id: accountId,
      name: "Account (Unavailable)",
      number: "*****",
      status: "UNAVAILABLE",
      holdings: [],
      balance: {
        cash: 0,
        buying_power: 0,
      },
    };
  }
}
