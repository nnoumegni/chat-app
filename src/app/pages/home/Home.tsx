"use client"
import {Header} from "../../components/Header";
import {SideNav} from "../../components/SideNav";
import {useCallback, useState} from "react";
import {useFetchData} from "../../hooks/fetch-data";
import {PositionTable} from "../../components/Positions/PositionTable";

const Home = () => {

    const [searchStr, setSearchStr] = useState(null);
    const {loading, data: items, error} = useFetchData({
        path: 'trading',
        action: 'getPositions',
        token: `${new Date().getTime()}`,
        data: {searchStr}
    })

    const handleSearch = useCallback((val) => {
        setSearchStr(val);
    }, [searchStr]);


  return (
      <>
        <div className="relative font-[sans-serif] pt-[70px] h-screen">
          <Header handleSearch={handleSearch} />
          <div>
            <div className="flex items-start">
                <SideNav/>
                <div style={{position: 'relative', flex: 1}}>
                    {!loading && <PositionTable items={items} />}
                    {loading && <div>Loading...</div>}
                </div>
            </div>
          </div>
        </div>
      </>
  );
}

export default Home;
