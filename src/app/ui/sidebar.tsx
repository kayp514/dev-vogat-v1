'use client'

import { useState } from 'react'
import Link from 'next/link'
import CallService from './callservice'
import ChatService from './chatservice'
import { ChatBubbleOvalLeftEllipsisIcon, DevicePhoneMobileIcon,Bars3Icon,BellIcon, DivideIcon, } from '@heroicons/react/24/outline'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    TransitionChild,
  } from '@headlessui/react'

interface UserData {
    displayName?: string;
    email: string;
    photoURL?: string;
    uid: string;
}

const navigation = [
    { name: 'Chat', id: 'chat', icon: ChatBubbleOvalLeftEllipsisIcon, current: true },
    { name: 'Calls', id: 'call', icon: DevicePhoneMobileIcon, current: false },

  ]

  const userNavigation = [
    { name: 'Your profile' },
    { name: 'Sign out' },
  ]

  function Call() {
    return <div><CallService /> </div>
  }

  function Chat() {
    return <div><ChatService /></div>
  }

export default function SideBar({ userData }: { userData: UserData }) {
    const [activeTab, setActiveTab] = useState('chat');

    const handleTabClick = (tab: string) => {
      setActiveTab(tab);
    };

    const handleSignOut = async () => {
      try {
        const response = await fetch('/auth/logout', { 
          method: 'POST',
          credentials: 'include',
        })
        
        if (response.ok) {
  
          // Redirect to login page
          window.location.reload()
        } else {
          const data = await response.json()
          console.error('Sign out failed:', data.error)
          alert('Sign out failed. Please try again.')
        }
      } catch (error) {
        console.error('Error during sign out:', error)
        alert('An error occurred during sign out. Please try again.')
      }
    }

    return (
        <div className="h-screen ">
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-15 lg:bg-gray-100 lg:pb-4">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 border-r border-gray-200 px-2">
            <div className="flex h-16 shrink-0 items-center">
              <img
                alt="Your Company"
                src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                className="h-8 w-auto"
              />
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <button
                          onClick={() => setActiveTab(item.id)}
                          className={`group flex flex-col items-center rounded-md p-3 text-xs font-medium ${
                            activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                          }`}
                        >
                          <item.icon
                            aria-hidden="true"
                            className="h-6 w-6"
                          />
                          <span className="mt-2">{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* bar with profile */}


        <div className="lg:pl-20">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">

            {/* Separator */}
            <div aria-hidden="true" className="h-6 w-px bg-gray-900/10 lg:hidden" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="relative flex flex-1">

              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="h-6 w-6" />
                </button>

                {/* Separator */}
                <div aria-hidden="true" className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" />

                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <MenuButton className="-m-1.5 flex items-center p-1.5">
                    <span className="sr-only">Open user menu</span>
                    <img
                      alt=""
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      className="h-8 w-8 rounded-full bg-gray-50"
                    />
                    <span className="hidden lg:flex lg:items-center">
                      <span aria-hidden="true" className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                        {userData.displayName || userData.email}
                      </span>
                      <ChevronDownIcon aria-hidden="true" className="ml-2 h-5 w-5 text-gray-400" />
                    </span>
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        {item.name === 'Sign out' ? (
                          <button
                            onClick={handleSignOut}
                            className="block w-full px-3 py-1 text-sm leading-6 text-gray-900 data-[focus]:bg-gray-50"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <button
                            className="block px-3 py-1 text-sm leading-6 text-gray-900 data-[focus]:bg-gray-50"
                          >
                          {item.name}
                        </button>
                        )}
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>
        </div>
        <main>
        {activeTab === 'call' && <Call />}
        {activeTab === 'chat' && <Chat />}
        </main>
      </div>

    );

}