"use client"

import {
  Navbar as UiNavbar,
  getNavbarItems,
  usePageLoading,
  useSidebar,
} from "docs-ui"
import FeedbackModal from "./FeedbackModal"
import { useMemo } from "react"
import { config } from "../../config"
import { usePathname } from "next/navigation"
import VersionSwitcher from "../VersionSwitcher"
import { getBasePathUrl } from "../../utils/get-base-path-url"

const Navbar = () => {
  const { setMobileSidebarOpen, mobileSidebarOpen } = useSidebar()
  const pathname = usePathname()
  const { isLoading } = usePageLoading()

  const navbarItems = useMemo(
    () =>
      getNavbarItems({
        basePath: config.baseUrl,
        activePath: pathname,
      }),
    [pathname]
  )

  return (
    <UiNavbar
      logo={{
        light: getBasePathUrl("/images/logo-icon.png"),
        dark: getBasePathUrl("/images/logo-icon-dark.png"),
      }}
      items={navbarItems}
      mobileMenuButton={{
        setMobileSidebarOpen,
        mobileSidebarOpen,
      }}
      additionalActionsBefore={<VersionSwitcher />}
      additionalActionsAfter={<FeedbackModal />}
      isLoading={isLoading}
    />
  )
}

export default Navbar
