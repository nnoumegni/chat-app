'use client'

import { useState } from 'react'
import './AuthFormComponent.scss'
import TabButtonComponent from '../TabButton/TabButton.component'
import { TabItems } from '../../constants/TabItems.constant'
import SigninTabContentComponent from '../SigninTabContent/SigninTabContent.component'
import RegisterTabContentComponent from '../RegisterTabContent/RegisterTabContent.component'
import ForgetTabContentComponent from '../ForgetTabContent/ForgetTabContent.component'
import {useUserStore} from "../../store/App.store";

export default function AuthFormComponent({ defaultTab = 'signin', handleSignIn }) {
  const { user: currentUserState, showAuthPage } = useUserStore();
  const [currentTab, setCurrentTab] = useState(defaultTab)
  const tabClickHandler = (tab) => {
    setCurrentTab(tab)
  }

  return (
    <>
      <div id="userAuthForm">
        <div className="cd-user-modal is-visible">
          <div className="cd-user-modal-container">
            <ul className="cd-switcher" style={{ position: 'relative' }}>
              <a href="javascript:;" id="loginModalCloseBtn">
                <i className="fa fa-close" />
              </a>
              {Object.keys(TabItems).map((key) => (
                <TabButtonComponent
                  key={key}
                  title={TabItems[key].title}
                  cssCls={`cd-signin ${currentTab === key ? 'selected' : ''}`}
                  onClick={() => tabClickHandler(key)}
                />
              ))}
            </ul>
            {currentTab === 'signin' && (
              <SigninTabContentComponent
                showForgetTab={() => tabClickHandler('forget')}
                onSignin={handleSignIn}
              />
            )}
            {currentTab === 'register' && (
              <RegisterTabContentComponent />
            )}
            {currentTab === 'forget' && (
              <ForgetTabContentComponent
                setHomeTab={() => tabClickHandler('signin')}
              />
            )}
            <a className="cd-close-form" href="javascript:;">
              Close
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
