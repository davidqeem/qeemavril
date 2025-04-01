"use client";

import { AccountOverview } from "./account-overview";

type Account = {
  id: string;
  name: string;
  number?: string;
  brokerage: {
    name: string;
    logo?: string;
  };
  holdings?: {
    symbol: string;
    quantity: number;
    value: number;
    currency: string;
  }[];
  balance?: {
    cash: number;
    currency: string;
  };
  lastActivity?: {
    date: string;
    type: string;
  };
};

type AccountOverviewWrapperProps = {
  accounts: Account[];
};

export function AccountOverviewWrapper({
  accounts,
}: AccountOverviewWrapperProps) {
  return <AccountOverview accounts={accounts} />;
}
