import { NextResponse } from "next/server";

// Set cache control headers to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const mockHoldings = [
    {
      symbol: "SCHD",
      name: "Schwab US Dividend Equity ETF",
      quantity: 25,
      pricePerShare: 27.81,
      totalValue: 695.25,
      gainLoss: 45.25,
      purchasePrice: 26.0,
      costBasis: 650.0,
      accountId: "mock-account-1",
      accountName: "Retirement Account",
      brokerName: "Schwab",
      currency: "USD",
      isCash: false,
      percentOfPortfolio: 46.35,
    },
    {
      symbol: "XLV",
      name: "Health Care Select Sector SPDR Fund",
      quantity: 5,
      pricePerShare: 146.45,
      totalValue: 732.25,
      gainLoss: 32.25,
      purchasePrice: 140.0,
      costBasis: 700.0,
      accountId: "mock-account-1",
      accountName: "Retirement Account",
      brokerName: "Schwab",
      currency: "USD",
      isCash: false,
      percentOfPortfolio: 48.82,
    },
    {
      symbol: "CASH",
      name: "Cash (USD)",
      quantity: 1,
      pricePerShare: 72.5,
      totalValue: 72.5,
      gainLoss: 0,
      purchasePrice: 72.5,
      costBasis: 72.5,
      accountId: "mock-account-1",
      accountName: "Retirement Account",
      brokerName: "Schwab",
      currency: "USD",
      isCash: true,
      percentOfPortfolio: 4.83,
    },
  ];

  return NextResponse.json(
    { holdings: mockHoldings },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
