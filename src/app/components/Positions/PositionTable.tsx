"use client"
import {useCallback, useState} from "react";
import {AssetType} from "../../models/AssetType";
import {PositionItem} from "./PositionItem";
import {PositionFields} from "../../constants/PositionFields";
import Charts from "../Charts/Charts";

export const PositionTable = ({items}: {items: AssetType[];}) => {
    const [showChart, setShowChart] = useState(false);
    const [chartData, setChartData] = useState({});

    const showPositionChart = useCallback(({symbol, exchange}: {symbol: string; exchange: string;}) => {
        setShowChart(true);
        setChartData({symbol, exchange});
    }, [setShowChart, setChartData]);

    return (
        <>
            {showChart && <Charts chartData={chartData} />}
            <section className="main-content w-full overflow-auto p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-800 whitespace-nowrap">
                        <tr>
                            {Object.keys(PositionFields).map((key, index) => {
                                return (
                                    <th key={index} className="p-4 text-left text-sm font-medium text-white">
                                        {PositionFields[key]}
                                    </th>
                                )
                            })}
                            <th className="p-4 text-left text-sm font-medium text-white">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="whitespace-nowrap">
                        {items.filter(item => item.cost_basis > 0).sort((a, b) => {
                            const diff1 = a.market_value - a.cost_basis;
                            const diff2 = b.market_value - b.cost_basis;
                            a.trend = diff1/Math.abs(diff1);
                            b.trend = diff2/Math.abs(diff2);

                            return (diff2 - diff1);
                        }).map((item: AssetType, index: number) => {
                            return <PositionItem showPositionChart={showPositionChart} item={item} key={index}/>
                        })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    )
}
