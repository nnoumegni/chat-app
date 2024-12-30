import {AssetType} from "../../models/AssetType";
import {PositionFields} from "../../constants/PositionFields";
import Link from "next/link";

export const PositionItem = ({item, showPositionChart}: {item: AssetType; showPositionChart: Function}) => {
    const {symbol, exchange, current_price, cost_basis, trend, market_value} = item;
    return (
        <tr className="even:bg-blue-50">
            {Object.keys(PositionFields).map((key, index) => {
                return (
                    <>
                        {key !== 'profit' && (
                            <td key={index} className="p-4 text-sm text-black">
                                <Link href={'#'} onClick={() => showPositionChart({symbol, exchange})}>{item[key]}</Link>
                            </td>
                        )}
                        {key === 'profit' && (
                            <td key={index} className={`p-4 text-sm text-black profit ${trend > 0 && 'text-teal-700\t'} ${trend < 0 && 'text-pink-800'}`}>
                                <Link href={'#'} onClick={() => showPositionChart({symbol, exchange})}>{parseFloat(`${market_value - cost_basis}`).toFixed(2)}</Link>
                            </td>
                        )}
                    </>
                )
            })}
            <td className="p-4">
                <button type="button"
                        className="px-5 py-2.5 rounded-lg text-sm tracking-wider font-medium border border-orange-700 outline-none bg-transparent hover:bg-orange-700 text-orange-700 hover:text-white transition-all duration-300">Sell
                </button>
            </td>
        </tr>
    )
}
