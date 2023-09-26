"use client"

import {
  AiAssistantProvider,
  AnalyticsProvider,
  ColorModeProvider,
  MobileProvider,
  ModalProvider,
  NavbarProvider,
  PageLoadingProvider,
  ScrollControllerProvider,
} from "docs-ui"
import BaseSpecsProvider from "./base-specs"
import SidebarProvider from "./sidebar"
import SearchProvider from "./search"

type ProvidersProps = {
  children?: React.ReactNode
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <AnalyticsProvider writeKey={process.env.NEXT_PUBLIC_SEGMENT_API_KEY}>
      <PageLoadingProvider>
        <ModalProvider>
          <ColorModeProvider>
            <BaseSpecsProvider>
              <SidebarProvider>
                <NavbarProvider>
                  <ScrollControllerProvider>
                    <SearchProvider>
                      <AiAssistantProvider
                        apiUrl={
                          process.env.NEXT_PUBLIC_AI_ASSISTANT_URL || "temp"
                        }
                        apiToken={
                          process.env.NEXT_PUBLIC_AI_API_ASSISTANT_TOKEN ||
                          "temp"
                        }
                      >
                        <MobileProvider>{children}</MobileProvider>
                      </AiAssistantProvider>
                    </SearchProvider>
                  </ScrollControllerProvider>
                </NavbarProvider>
              </SidebarProvider>
            </BaseSpecsProvider>
          </ColorModeProvider>
        </ModalProvider>
      </PageLoadingProvider>
    </AnalyticsProvider>
  )
}

export default Providers
