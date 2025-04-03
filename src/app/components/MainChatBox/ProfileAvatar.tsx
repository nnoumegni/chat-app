import {Utils} from "../../helpers/utils";

export const ProfileAvatar = ({thumb ='', width = 'w-14', height = 'h-14', fullname = '', className='', showStatus = false}) => {
    const src = thumb && /^http/gi.test(thumb) ? thumb : Utils.thumbFromInitials({fullName: fullname});

    return (
        <>
            <div className="relative inline-block">
                <img src={src} className={`${width} ${height} rounded-full`} alt={fullname}/>
                {showStatus && <span className={"h-3 w-3 rounded-full border border-white bg-green-500 block absolute bottom-1 right-0 " + className}/>}
            </div>
        </>
    )
}