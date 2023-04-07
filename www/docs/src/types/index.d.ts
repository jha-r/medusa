declare global {
  interface Window {
    analytics?: any
  }
}

declare module "@theme/CodeBlock" {
  import type { ReactNode } from "react"
  import type { Props as DocusaurusProps } from "@theme/CodeBlock"

  export interface Props extends DocusaurusProps {
    readonly noReport?: boolean
    readonly noCopy?: boolean
  }
}

declare module "@theme/CodeBlock/Content/String" {
  import type { Props as CodeBlockProps } from "@theme/CodeBlock"

  export interface Props extends Omit<CodeBlockProps, "children"> {
    readonly children: string
    readonly noReport?: boolean
    readonly noCopy?: boolean
  }

  export default function CodeBlockStringContent(props: Props): JSX.Element
}

declare module "@medusajs/docs" {
  import type { ThemeConfig as DocusaurusThemeConfig } from "@docusaurus/preset-classic"
  import type { DocusaurusConfig } from "@docusaurus/types"
  import type {
    PropSidebarItemCategory,
    PropSidebarItemLink,
    PropSidebarItemHtml,
  } from "@docusaurus/plugin-content-docs"
  import { BadgeProps } from "../components/Badge/index"
  import { IconProps } from "../theme/Icon/index"

  type ItemCustomProps = {
    customProps?: {
      themedImage: {
        light: string
        dark?: string
      }
      image?: string
      icon?: React.FC<IconProps>
      iconName?: string
      description?: string
      className?: string
      isSoon?: boolean
      badge: BadgeProps
      html?: string
      sidebar_icon?: string
      sidebar_is_title?: boolean
    }
  }

  export declare type ModifiedPropSidebarItemCategory =
    PropSidebarItemCategory & ItemCustomProps

  export declare type ModifiedPropSidebarItemLink = PropSidebarItemLink &
    ItemCustomProps

  export declare type ModifiedPropSidebarItemHtml = PropSidebarItemHtml &
    ItemCustomProps

  export declare type ModifiedSidebarItem =
    | ModifiedPropSidebarItemCategory
    | ModifiedPropSidebarItemLink
    | ModifiedPropSidebarItemHtml

  export declare type ThemeConfig = {
    reportCodeLinkPrefix?: string
    footerFeedback: {
      event?: string
    }
    socialLinks?: SocialLink[]
    cloudinaryConfig?: {
      cloudName?: string
      flags?: string[]
      resize?: {
        action: string
        width?: number
        height?: number
        aspectRatio?: string
      }
      roundCorners?: number
    }
    prism: {
      magicComments: MagicCommentConfig[]
    }
  } & DocusaurusThemeConfig

  export declare type MedusaDocusaurusConfig = {
    themeConfig: ThemeConfig
  } & DocusaurusConfig

  export declare type SocialLink = {
    href: string
    type: string
  }
}
