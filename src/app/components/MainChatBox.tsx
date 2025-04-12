import '../../../public/assets/scss/bundle.scss';
import '../../../public/assets/scss/app.scss';

import {TopNav} from "./MainChatBox/TopNav";
import {AsideLeft} from "./MainChatBox/AsideLeft";
import {ChatBox} from "./MainChatBox/ChatBox";
import {AsideRight} from "./MainChatBox/AsideRight";
import {QuickChatBox} from "./MainChatBox/QuickChatBox";
import {AudioCallModal} from "./MainChatBox/AudioCallModal";
import {VideoCallModal} from "./MainChatBox/VideoCallModal";
import {MuteOptionsModal} from "./MainChatBox/MuteOptionsModal";
import {NewChatModal} from "./MainChatBox/NewChatModal";
import {DeleteChatModal} from "./MainChatBox/DeleteChatModal";
import {useEffect} from "react";
import {Utils} from "../helpers/utils";
import {useAppStore} from "../store/use-app.store";

export const MainChatBox = () => {
    const {showAside} = useAppStore();
    const asideActiveCls = showAside ? 'show-aside' : '';

    useEffect(() => {
        Utils.loadScripts({
            urls: [
                '/assets/js/bundle.js',
                '/assets/js/app.js',
            ],
            callback: () => {
                console.log('scripts loaded...')
            }
        })
    }, []);

    return (
        <div className="tyn-body">
            <div className="tyn-root">
                <TopNav/>
                <div className="tyn-content tyn-content-full-height tyn-chat has-aside-base">
                    <AsideLeft/>
                    <div className={'tyn-main tyn-chat-content ' + asideActiveCls} id="tynMain">
                        <ChatBox/>
                        <AsideRight/>
                    </div>
                </div>
                <QuickChatBox/>
            </div>
            <VideoCallModal/>
            <MuteOptionsModal/>
            <NewChatModal/>
            <DeleteChatModal/>
        </div>
    )
}
