export type AssetType = {
    symbol: string;
    cost_basis: string;
    current_price: string;
    market_value: string;
    qty_available: string;
    unrealized_pl: string;
    exchange: string;
    trend: number;
};

export type ChartDataType = {
    symbol: string;
    exchange: string;
}
